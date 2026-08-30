package com.crimelens;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class CrimeLensApplication {

    public static void main(String[] args) {
        SpringApplication.run(CrimeLensApplication.class, args);
    }
}
