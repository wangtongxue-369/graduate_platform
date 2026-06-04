package com.graduateplatform.common.service;

import com.graduateplatform.common.config.CosProperties;
import com.qcloud.cos.COSClient;
import com.qcloud.cos.ClientConfig;
import com.qcloud.cos.auth.BasicCOSCredentials;
import com.qcloud.cos.auth.COSCredentials;
import com.qcloud.cos.exception.CosServiceException;
import com.qcloud.cos.model.GetObjectRequest;
import com.qcloud.cos.model.ObjectMetadata;
import com.qcloud.cos.model.PutObjectRequest;
import com.qcloud.cos.region.Region;
import com.qcloud.cos.model.COSObject;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.InputStream;

@Slf4j
@Service
public class CosService {

    private final CosProperties cosProperties;
    private COSClient cosClient;

    public CosService(CosProperties cosProperties) {
        this.cosProperties = cosProperties;
    }

    @PostConstruct
    public void init() {
        COSCredentials credentials = new BasicCOSCredentials(cosProperties.getSecretId(), cosProperties.getSecretKey());
        ClientConfig clientConfig = new ClientConfig(new Region(cosProperties.getRegion()));
        this.cosClient = new COSClient(credentials, clientConfig);
        log.info("COS client initialized with bucket: {}, region: {}", cosProperties.getBucket(), cosProperties.getRegion());
    }

    public String uploadFile(InputStream inputStream, long fileSize, String cosKey, String contentType) {
        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(fileSize);
        metadata.setContentType(contentType);
        PutObjectRequest putObjectRequest = new PutObjectRequest(cosProperties.getBucket(), cosKey, inputStream, metadata);
        try {
            cosClient.putObject(putObjectRequest);
            log.info("File uploaded to COS: {}", cosKey);
            return cosProperties.getBaseUrl() + "/" + cosKey;
        } catch (CosServiceException e) {
            log.error("Failed to upload file to COS: {}", cosKey, e);
            throw new RuntimeException("文件上传失败: " + e.getMessage());
        }
    }

    public String getDownloadUrl(String cosKey) {
        GetObjectRequest getObjectRequest = new GetObjectRequest(cosProperties.getBucket(), cosKey);
        return cosClient.getObjectUrl(getObjectRequest).toString();
    }

    public COSObject getObject(String cosKey) {
        GetObjectRequest getObjectRequest = new GetObjectRequest(cosProperties.getBucket(), cosKey);
        return cosClient.getObject(getObjectRequest);
    }

    public void deleteFile(String cosKey) {
        try {
            cosClient.deleteObject(cosProperties.getBucket(), cosKey);
            log.info("File deleted from COS: {}", cosKey);
        } catch (CosServiceException e) {
            log.error("Failed to delete file from COS: {}", cosKey, e);
            throw new RuntimeException("文件删除失败: " + e.getMessage());
        }
    }

    public COSClient getCosClient() {
        return cosClient;
    }

    public String getBucket() {
        return cosProperties.getBucket();
    }
}