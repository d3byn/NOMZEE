package com.example.foodapp.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();

        //  Allow frontend origin
        config.setAllowedOrigins(List.of("http://localhost:5173"));

        //  Allow all HTTP methods
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        //  Allow all headers
        config.setAllowedHeaders(List.of("*"));

        //  Allow cookies/session (VERY IMPORTANT)
        config.setAllowCredentials(true);

        //  IMPORTANT ADDITION (fixes many frontend issues)
        config.setExposedHeaders(List.of("Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

        //  Allow ALL endpoints (auth, admin, payment, etc.)
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}