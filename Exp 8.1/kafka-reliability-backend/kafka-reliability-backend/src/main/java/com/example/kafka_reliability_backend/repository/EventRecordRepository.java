package com.example.kafka_reliability_backend.repository;

import com.example.kafka_reliability_backend.entity.EventRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EventRecordRepository
        extends JpaRepository<EventRecord, Long> {

    Optional<EventRecord> findByEventId(String eventId);

    boolean existsByEventId(String eventId);
}