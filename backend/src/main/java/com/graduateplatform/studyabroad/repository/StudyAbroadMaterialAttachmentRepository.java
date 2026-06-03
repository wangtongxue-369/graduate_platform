package com.graduateplatform.studyabroad.repository;

import com.graduateplatform.studyabroad.entity.StudyAbroadMaterialAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StudyAbroadMaterialAttachmentRepository extends JpaRepository<StudyAbroadMaterialAttachment, Long> {
    Optional<StudyAbroadMaterialAttachment> findByIdAndMaterialIdAndMaterialUserId(Long id, Long materialId, Long userId);
}
