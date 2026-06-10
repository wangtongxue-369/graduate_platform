package com.graduateplatform.kaoyan.repository;

import com.graduateplatform.kaoyan.entity.ResourceMaterial;
import com.graduateplatform.kaoyan.entity.MaterialStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface ResourceMaterialRepository extends JpaRepository<ResourceMaterial, Long>, JpaSpecificationExecutor<ResourceMaterial> {

    Page<ResourceMaterial> findByStatusAndActiveTrue(MaterialStatus status, Pageable pageable);

    Page<ResourceMaterial> findByActiveTrue(Pageable pageable);

    Page<ResourceMaterial> findByUploaderIdAndActiveTrue(Long uploaderId, Pageable pageable);

    Page<ResourceMaterial> findByUploaderIdAndStatusAndActiveTrue(Long uploaderId, MaterialStatus status, Pageable pageable);
}