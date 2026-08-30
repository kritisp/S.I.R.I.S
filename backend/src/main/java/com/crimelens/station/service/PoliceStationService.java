package com.crimelens.station.service;

import com.crimelens.audit.service.AuditService;

import com.crimelens.station.dto.request.CreateStationRequest;
import com.crimelens.station.dto.request.UpdateStationRequest;
import com.crimelens.station.dto.response.PoliceStationDTO;
import com.crimelens.station.entity.PoliceStation;
import com.crimelens.station.entity.enums.StationStatus;
import com.crimelens.common.exceptions.DuplicateResourceException;
import com.crimelens.common.exceptions.ResourceNotFoundException;
import com.crimelens.station.repository.PoliceStationRepository;
import com.crimelens.security.UserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PoliceStationService {

    private final PoliceStationRepository stationRepository;
    private final AuditService auditService;

    public PoliceStationService(PoliceStationRepository stationRepository, AuditService auditService) {
        this.stationRepository = stationRepository;
        this.auditService = auditService;
    }

    @Transactional
    public PoliceStationDTO createStation(CreateStationRequest request, UserPrincipal actor) {
        if (stationRepository.existsById(request.getId())) {
            throw new DuplicateResourceException("Police station with Code/ID '" + request.getId() + "' already exists");
        }

        PoliceStation station = new PoliceStation(
                request.getId(),
                request.getName(),
                request.getDistrict(),
                request.getCity(),
                request.getState(),
                request.getStatus() != null ? request.getStatus() : StationStatus.ACTIVE
        );

        PoliceStation saved = stationRepository.save(station);

        auditService.logUserAction(actor, "CREATE_STATION", "STATION", saved.getId(),
                "Created police station: " + saved.getName() + " [" + saved.getId() + "]");

        return PoliceStationDTO.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public PoliceStationDTO getStationById(String id) {
        PoliceStation station = stationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PoliceStation", "id", id));
        return PoliceStationDTO.fromEntity(station);
    }

    @Transactional(readOnly = true)
    public PoliceStation getStationEntityById(String id) {
        return stationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PoliceStation", "id", id));
    }

    @Transactional(readOnly = true)
    public List<PoliceStationDTO> getAllStations() {
        return stationRepository.findAll()
                .stream()
                .map(PoliceStationDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PoliceStationDTO> getStationsByDistrict(String district) {
        return stationRepository.findByDistrictIgnoreCase(district)
                .stream()
                .map(PoliceStationDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public PoliceStationDTO updateStation(String id, UpdateStationRequest request, UserPrincipal actor) {
        PoliceStation station = stationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PoliceStation", "id", id));

        if (request.getName() != null && !request.getName().isBlank()) {
            station.setName(request.getName());
        }
        if (request.getDistrict() != null && !request.getDistrict().isBlank()) {
            station.setDistrict(request.getDistrict());
        }
        if (request.getCity() != null && !request.getCity().isBlank()) {
            station.setCity(request.getCity());
        }
        if (request.getState() != null && !request.getState().isBlank()) {
            station.setState(request.getState());
        }
        if (request.getStatus() != null) {
            station.setStatus(request.getStatus());
        }

        PoliceStation updated = stationRepository.save(station);

        auditService.logUserAction(actor, "UPDATE_STATION", "STATION", updated.getId(),
                "Updated police station metadata: " + updated.getId());

        return PoliceStationDTO.fromEntity(updated);
    }
}
