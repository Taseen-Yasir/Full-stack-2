package com.example.ci_pipeline_lab.controller;

import com.example.ci_pipeline_lab.entity.BuildRun;
import com.example.ci_pipeline_lab.service.BuildRunService;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.NoSuchElementException;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest
class BuildRunControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private BuildRunService service;

    @Test
    void createBuildShouldReturn201() throws Exception {
        when(service.createBuild("Add CI tests"))
                .thenReturn(new BuildRun("Add CI tests"));

        mockMvc.perform(post("/api/builds")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "commitMessage": "Add CI tests"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.commitMessage")
                        .value("Add CI tests"))
                .andExpect(jsonPath("$.status")
                        .value("QUEUED"));

        verify(service).createBuild("Add CI tests");
    }

    @Test
    void createBuildShouldRejectBlankMessage() throws Exception {
        mockMvc.perform(post("/api/builds")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "commitMessage": "   "
                                }
                                """))
                .andExpect(status().isBadRequest());

        verify(service, never()).createBuild(anyString());
    }

    @Test
    void getAllBuildsShouldReturn200() throws Exception {
        when(service.getAllBuilds()).thenReturn(List.of(
                new BuildRun("Add unit tests"),
                new BuildRun("Fix API")
        ));

        mockMvc.perform(get("/api/builds"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].commitMessage")
                        .value("Add unit tests"))
                .andExpect(jsonPath("$[1].commitMessage")
                        .value("Fix API"));
    }

    @Test
    void getBuildByIdShouldReturn200() throws Exception {
        when(service.getBuildById(1L))
                .thenReturn(new BuildRun("Create CI pipeline"));

        mockMvc.perform(get("/api/builds/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.commitMessage")
                        .value("Create CI pipeline"))
                .andExpect(jsonPath("$.status")
                        .value("QUEUED"));
    }

    @Test
    void getMissingBuildShouldReturn404() throws Exception {
        when(service.getBuildById(999L))
                .thenThrow(new NoSuchElementException(
                        "Build not found: 999"
                ));

        mockMvc.perform(get("/api/builds/999"))
                .andExpect(status().isNotFound());
    }
}