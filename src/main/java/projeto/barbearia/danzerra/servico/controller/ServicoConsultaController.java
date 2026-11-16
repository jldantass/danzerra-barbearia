package projeto.barbearia.danzerra.servico.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import projeto.barbearia.danzerra.servico.dto.ServicoResponse;
import projeto.barbearia.danzerra.servico.service.ServicoService;

@RestController
@RequestMapping("/api/servicos")
public class ServicoConsultaController {

    private final ServicoService servicos;

    public ServicoConsultaController(ServicoService servicos) {
        this.servicos = servicos;
    }

    @GetMapping
    public List<ServicoResponse> listar() {
        return servicos.listar();
    }
}
