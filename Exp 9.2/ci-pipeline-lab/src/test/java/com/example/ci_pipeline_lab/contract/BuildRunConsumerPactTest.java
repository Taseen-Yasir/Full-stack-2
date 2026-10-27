package com.example.ci_pipeline_lab.contract;

import au.com.dius.pact.consumer.MockServer;
import au.com.dius.pact.consumer.dsl.PactBuilder;
import au.com.dius.pact.consumer.junit5.PactConsumerTestExt;
import au.com.dius.pact.consumer.junit5.PactTestFor;
import au.com.dius.pact.core.model.V4Pact;
import au.com.dius.pact.core.model.annotations.Pact;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(PactConsumerTestExt.class)
class BuildRunConsumerPactTest {

    @Pact(
        consumer = "CI Pipeline Dashboard",
        provider = "CI Pipeline Lab API"
    )
    public V4Pact getBuildsContract(PactBuilder builder) {

        return builder
                .usingLegacyDsl()
                .uponReceiving("a request for build history")
                    .path("/api/builds")
                    .method("GET")
                    .headers(Map.of("Accept", "application/json"))
                .willRespondWith()
                    .status(200)
                    .headers(Map.of("Content-Type", "application/json"))
                    .body("[]")
                .toPact(V4Pact.class);
    }

    @Test
    @PactTestFor(
        providerName = "CI Pipeline Lab API",
        pactMethod = "getBuildsContract"
    )
    void consumerShouldReadBuildHistory(MockServer mockServer)
            throws Exception {

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(
                        mockServer.getUrl() + "/api/builds"
                ))
                .header("Accept", "application/json")
                .GET()
                .build();

        HttpResponse<String> response =
                HttpClient.newHttpClient().send(
                        request,
                        HttpResponse.BodyHandlers.ofString()
                );

        assertEquals(200, response.statusCode());

        assertTrue(
                response.headers()
                        .firstValue("Content-Type")
                        .orElse("")
                        .contains("application/json")
        );

        assertEquals("[]", response.body());
    }
}