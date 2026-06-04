package com.graduateplatform.community.repository;

import com.graduateplatform.community.entity.PostCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PostCategoryRepository extends JpaRepository<PostCategory, Long> {
    Optional<PostCategory> findByCode(String code);

    List<PostCategory> findByActiveTrueOrderBySortOrderAscIdAsc();

    List<PostCategory> findAllByOrderBySortOrderAscIdAsc();
}
