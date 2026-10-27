package com.example.ci_pipeline_lab.repository;

import com.example.ci_pipeline_lab.entity.BuildRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BuildRunRepository extends JpaRepository<BuildRun, Long> {
}