package com.crimelens.station.repository;

import com.crimelens.station.entity.PoliceStation;
import com.crimelens.station.entity.enums.StationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PoliceStationRepository extends JpaRepository<PoliceStation, String> {
    List<PoliceStation> findByDistrictIgnoreCase(String district);
    List<PoliceStation> findByStatus(StationStatus status);
}
