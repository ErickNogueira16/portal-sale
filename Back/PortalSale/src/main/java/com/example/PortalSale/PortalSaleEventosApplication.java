package com.example.PortalSale;

import java.util.TimeZone;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

//Arquivo de inicialização da aplicação
@SpringBootApplication
public class PortalSaleEventosApplication {

	public static void main(String[] args) {
		TimeZone.setDefault(TimeZone.getTimeZone("America/Sao_Paulo"));
		SpringApplication.run(PortalSaleEventosApplication.class, args);
	}

}
