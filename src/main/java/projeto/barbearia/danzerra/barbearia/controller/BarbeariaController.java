package projeto.barbearia.danzerra.barbearia.controller;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import projeto.barbearia.danzerra.barbearia.dto.BarbeariaDados;
import projeto.barbearia.danzerra.barbearia.service.BarbeariaService;

@RestController
@RequestMapping("/api")
public class BarbeariaController {

    private final BarbeariaService barbearia;

    public BarbeariaController(BarbeariaService barbearia) {
        this.barbearia = barbearia;
    }

    @GetMapping("/barbearia")
    public BarbeariaDados consultar() {
        return barbearia.consultar();
    }

    @PutMapping("/atualizar_barbearia")
    public BarbeariaDados atualizar(@Valid @RequestBody BarbeariaDados dados) {
        return barbearia.atualizar(dados);
    }
}
