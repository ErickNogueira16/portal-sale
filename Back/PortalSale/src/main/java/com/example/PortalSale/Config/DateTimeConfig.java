package com.example.PortalSale.Config;

import java.time.Clock;
import java.time.ZoneId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DateTimeConfig {

    @Value("${app.time-zone:UTC}")
    private String timeZone;

    @Bean
    public ZoneId applicationZoneId() {
        return ZoneId.of(timeZone);
    }

    @Bean
    public Clock applicationClock(ZoneId applicationZoneId) {
        return Clock.system(applicationZoneId);
    }
}
