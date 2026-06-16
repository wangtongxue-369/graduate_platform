package com.graduateplatform;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Path;
import java.util.Properties;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.YamlPropertiesFactoryBean;
import org.springframework.core.io.FileSystemResource;
import org.springframework.util.unit.DataSize;

class UploadConfigurationTest {

    @Test
    void globalMultipartLimitCoversLargestConfiguredAttachment() {
        Properties properties = loadApplicationProperties();

        String multipartLimit = properties.getProperty("spring.servlet.multipart.max-file-size");
        String mockInterviewLimit = properties.getProperty("app.upload.mock-interview-max-bytes");

        assertNotNull(multipartLimit, "spring.servlet.multipart.max-file-size should be configured");
        assertNotNull(mockInterviewLimit, "app.upload.mock-interview-max-bytes should be configured");
        assertTrue(
            DataSize.parse(multipartLimit).toBytes() >= Long.parseLong(mockInterviewLimit),
            "Global multipart limit should be at least as large as the mock interview attachment limit"
        );
    }

    @Test
    void applicationConfigImportsOptionalLocalUploadOverrides() {
        Properties properties = loadApplicationProperties();

        String configImport = properties.getProperty("spring.config.import");

        assertNotNull(configImport, "spring.config.import should include optional local override files");
        assertTrue(
            configImport.contains("optional:file:./config/application-local.yml"),
            "application.yml should import backend-local overrides when running from the backend module"
        );
        assertTrue(
            configImport.contains("optional:file:./backend/config/application-local.yml"),
            "application.yml should import backend-local overrides when running from the repository root"
        );
    }

    private Properties loadApplicationProperties() {
        YamlPropertiesFactoryBean factory = new YamlPropertiesFactoryBean();
        factory.setResources(new FileSystemResource(Path.of("src", "main", "resources", "application.yml")));
        Properties properties = factory.getObject();
        assertNotNull(properties, "application.yml should be readable in tests");
        return properties;
    }
}
