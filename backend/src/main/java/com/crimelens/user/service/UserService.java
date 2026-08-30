package com.crimelens.user.service;

import com.crimelens.audit.service.AuditService;

import com.crimelens.user.dto.request.CreateUserRequest;
import com.crimelens.user.dto.request.UpdateUserRequest;
import com.crimelens.casefile.dto.response.OfficerCaseloadDTO;
import com.crimelens.user.dto.response.UserDTO;
import com.crimelens.station.entity.PoliceStation;
import com.crimelens.user.entity.User;
import com.crimelens.casefile.entity.enums.CaseStatus;
import com.crimelens.user.entity.enums.UserRole;
import com.crimelens.user.entity.enums.UserStatus;
import com.crimelens.common.exceptions.BadRequestException;
import com.crimelens.common.exceptions.DuplicateResourceException;
import com.crimelens.common.exceptions.ResourceNotFoundException;
import com.crimelens.common.exceptions.UnauthorizedAccessException;
import com.crimelens.casefile.repository.CaseRecordRepository;
import com.crimelens.station.repository.PoliceStationRepository;
import com.crimelens.user.repository.UserRepository;
import com.crimelens.security.StationSecurityEvaluator;
import com.crimelens.security.UserPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PoliceStationRepository stationRepository;
    private final CaseRecordRepository caseRepository;
    private final PasswordEncoder passwordEncoder;
    private final StationSecurityEvaluator securityEvaluator;
    private final AuditService auditService;

    public UserService(UserRepository userRepository,
                       PoliceStationRepository stationRepository,
                       CaseRecordRepository caseRepository,
                       PasswordEncoder passwordEncoder,
                       StationSecurityEvaluator securityEvaluator,
                       AuditService auditService) {
        this.userRepository = userRepository;
        this.stationRepository = stationRepository;
        this.caseRepository = caseRepository;
        this.passwordEncoder = passwordEncoder;
        this.securityEvaluator = securityEvaluator;
        this.auditService = auditService;
    }

    @Transactional
    public UserDTO createUser(CreateUserRequest request, UserPrincipal actor) {
        if (userRepository.existsById(request.getId())) {
            throw new DuplicateResourceException("User with ID '" + request.getId() + "' already exists");
        }

        // Role authorization check
        if (actor.getRole() == UserRole.OFFICER) {
            throw new UnauthorizedAccessException("Investigating officers cannot create new users");
        }

        // Station Admin can only create users for their station
        if (actor.getRole() == UserRole.STATION_ADMIN) {
            if (request.getRole() == UserRole.SUPER_ADMIN) {
                throw new UnauthorizedAccessException("Station admins cannot create super admin accounts");
            }
            if (request.getStationId() == null || !request.getStationId().equalsIgnoreCase(actor.getStationId())) {
                throw new UnauthorizedAccessException("Station admins can only create users for their assigned station: " + actor.getStationId());
            }
        }

        PoliceStation station = null;
        if (request.getStationId() != null && !request.getStationId().isBlank()) {
            station = stationRepository.findById(request.getStationId())
                    .orElseThrow(() -> new ResourceNotFoundException("PoliceStation", "id", request.getStationId()));
        } else if (request.getRole() != UserRole.SUPER_ADMIN) {
            throw new BadRequestException("Station ID is required for role: " + request.getRole());
        }

        String encodedPassword = passwordEncoder.encode(request.getPassword());

        User user = new User(
                request.getId(),
                request.getName(),
                request.getRole(),
                station,
                request.getRank(),
                request.getEmail(),
                encodedPassword,
                request.getStatus() != null ? request.getStatus() : UserStatus.ACTIVE
        );

        User saved = userRepository.save(user);

        auditService.logUserAction(actor, "CREATE_USER", "USER", saved.getId(),
                "Created user [" + saved.getId() + "] with role: " + saved.getRole());

        return UserDTO.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public UserDTO getUserById(String id, UserPrincipal actor) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        // Station Admin / Officer isolation
        if (!securityEvaluator.canManageUser(actor, user) && !actor.getUsername().equalsIgnoreCase(id)) {
            // If they are in the same station, officer can view basic profile
            String actorStation = actor.getStationId();
            String userStation = user.getStation() != null ? user.getStation().getId() : null;
            if (actorStation == null || !actorStation.equalsIgnoreCase(userStation)) {
                throw new UnauthorizedAccessException("Unauthorized to view profile of officer from another station");
            }
        }

        return UserDTO.fromEntity(user);
    }

    @Transactional(readOnly = true)
    public List<UserDTO> getAllUsers(String stationFilter, UserPrincipal actor) {
        if (actor.getRole() == UserRole.SUPER_ADMIN) {
            if (stationFilter != null && !stationFilter.isBlank() && !"ALL".equalsIgnoreCase(stationFilter)) {
                return userRepository.findByStationId(stationFilter).stream()
                        .map(UserDTO::fromEntity)
                        .collect(Collectors.toList());
            }
            return userRepository.findAll().stream()
                    .map(UserDTO::fromEntity)
                    .collect(Collectors.toList());
        }

        // Station Admin and Officer can only list users in their own station
        String userStation = actor.getStationId();
        if (userStation == null) {
            return List.of();
        }

        return userRepository.findByStationId(userStation).stream()
                .map(UserDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserDTO updateUser(String id, UpdateUserRequest request, UserPrincipal actor) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        // Check management authorization
        if (actor.getRole() == UserRole.OFFICER && !actor.getUsername().equalsIgnoreCase(id)) {
            throw new UnauthorizedAccessException("Officers cannot modify other users' profiles");
        }
        if (actor.getRole() == UserRole.STATION_ADMIN && !securityEvaluator.canManageUser(actor, user)) {
            throw new UnauthorizedAccessException("Station admin cannot modify users outside their station");
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName());
        }
        if (request.getRank() != null) {
            user.setRank(request.getRank());
        }
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        // Only admins can change roles and station assignments
        if (actor.getRole() == UserRole.SUPER_ADMIN || actor.getRole() == UserRole.STATION_ADMIN) {
            if (request.getStatus() != null) {
                user.setStatus(request.getStatus());
            }
            if (request.getRole() != null && actor.getRole() == UserRole.SUPER_ADMIN) {
                user.setRole(request.getRole());
            }
            if (request.getStationId() != null && actor.getRole() == UserRole.SUPER_ADMIN) {
                PoliceStation newStation = stationRepository.findById(request.getStationId())
                        .orElseThrow(() -> new ResourceNotFoundException("PoliceStation", "id", request.getStationId()));
                user.setStation(newStation);
            }
        }

        User updated = userRepository.save(user);

        auditService.logUserAction(actor, "UPDATE_USER", "USER", updated.getId(),
                "Updated user profile for: " + updated.getId());

        return UserDTO.fromEntity(updated);
    }

    @Transactional
    public UserDTO toggleUserStatus(String id, UserPrincipal actor) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        if (!securityEvaluator.canManageUser(actor, user)) {
            throw new UnauthorizedAccessException("Unauthorized to change status of this user");
        }

        user.setStatus(user.getStatus() == UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE);
        User updated = userRepository.save(user);

        auditService.logUserAction(actor, "TOGGLE_USER_STATUS", "USER", updated.getId(),
                "Set user status to: " + updated.getStatus());

        return UserDTO.fromEntity(updated);
    }

    @Transactional(readOnly = true)
    public OfficerCaseloadDTO getOfficerCaseload(String officerId, UserPrincipal actor) {
        User officer = userRepository.findById(officerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", officerId));

        if (!securityEvaluator.canManageUser(actor, officer) && !actor.getUsername().equalsIgnoreCase(officerId)) {
            String actorStation = actor.getStationId();
            String officerStation = officer.getStation() != null ? officer.getStation().getId() : null;
            if (actorStation == null || !actorStation.equalsIgnoreCase(officerStation)) {
                throw new UnauthorizedAccessException("Unauthorized to view caseload for this officer");
            }
        }

        long activeCases = caseRepository.countByInvestigatorIdAndStatus(officerId, CaseStatus.INVESTIGATING);
        long pendingCases = caseRepository.countByInvestigatorIdAndStatus(officerId, CaseStatus.PENDING);
        long solvedCases = caseRepository.countByInvestigatorIdAndStatus(officerId, CaseStatus.SOLVED) +
                           caseRepository.countByInvestigatorIdAndStatus(officerId, CaseStatus.CLOSED);
        long totalCases = activeCases + pendingCases + solvedCases;

        String stationId = officer.getStation() != null ? officer.getStation().getId() : null;

        return new OfficerCaseloadDTO(
                officer.getId(),
                officer.getName(),
                officer.getRank(),
                stationId,
                totalCases,
                activeCases,
                pendingCases,
                solvedCases
        );
    }
}
