package com.crimelens.security;

import com.crimelens.user.entity.User;
import com.crimelens.user.entity.enums.UserRole;
import com.crimelens.user.entity.enums.UserStatus;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

public class UserPrincipal implements UserDetails {

    private final String id;
    private final String name;
    private final UserRole role;
    private final String stationId;
    private final String rank;
    private final String email;
    private final String password;
    private final UserStatus status;
    private final Collection<? extends GrantedAuthority> authorities;

    public UserPrincipal(String id, String name, UserRole role, String stationId, String rank,
                         String email, String password, UserStatus status,
                         Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.name = name;
        this.role = role;
        this.stationId = stationId;
        this.rank = rank;
        this.email = email;
        this.password = password;
        this.status = status;
        this.authorities = authorities;
    }

    public static UserPrincipal create(User user) {
        SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + user.getRole().name());
        String stationId = user.getStation() != null ? user.getStation().getId() : null;

        return new UserPrincipal(
                user.getId(),
                user.getName(),
                user.getRole(),
                stationId,
                user.getRank(),
                user.getEmail(),
                user.getPasswordHash(),
                user.getStatus(),
                Collections.singletonList(authority)
        );
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public UserRole getRole() {
        return role;
    }

    public String getStationId() {
        return stationId;
    }

    public String getRank() {
        return rank;
    }

    public String getEmail() {
        return email;
    }

    public boolean isSuperAdmin() {
        return UserRole.SUPER_ADMIN.equals(role);
    }

    public boolean isStationAdmin() {
        return UserRole.STATION_ADMIN.equals(role);
    }

    public boolean isOfficer() {
        return UserRole.OFFICER.equals(role);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return id;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return UserStatus.ACTIVE.equals(status);
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return UserStatus.ACTIVE.equals(status);
    }
}
