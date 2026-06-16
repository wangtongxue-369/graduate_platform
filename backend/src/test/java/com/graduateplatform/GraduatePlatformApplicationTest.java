package com.graduateplatform;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.lang.reflect.Method;
import java.lang.reflect.Modifier;

import org.junit.jupiter.api.Test;

class GraduatePlatformApplicationTest {

    @Test
    void cacheManagerFactoryMethodIsStaticForDevtoolsRestarts() throws NoSuchMethodException {
        Method cacheManagerMethod = GraduatePlatformApplication.class.getDeclaredMethod("cacheManager");

        assertTrue(
            Modifier.isStatic(cacheManagerMethod.getModifiers()),
            "cacheManager factory method should be static so DevTools restarts do not bind it to a stale configuration instance"
        );
    }
}
