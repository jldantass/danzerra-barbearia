package projeto.barbearia.danzerra.cliente.controller;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import projeto.barbearia.danzerra.cliente.dto.ClientePaginaResponse;
import projeto.barbearia.danzerra.cliente.dto.ClienteResponse;
import projeto.barbearia.danzerra.cliente.service.ClienteService;

@RestController
@RequestMapping("/api/clientes")
public class ClienteConsultaController {

    private final ClienteService clientes;

    public ClienteConsultaController(ClienteService clientes) {
        this.clientes = clientes;
    }

    @GetMapping("/{id}")
    public ClienteResponse buscarPorId(@PathVariable Long id) {
        return clientes.buscarPorId(id);
    }

    @GetMapping
    public ClientePaginaResponse buscar(
            @RequestParam(defaultValue = "") String nome,
            @RequestParam(defaultValue = "") String celular,
            @RequestParam(defaultValue = "0") @Min(0) @Max(1_000_000) int pagina,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int tamanho) {
        PageRequest pedido = PageRequest.of(pagina, tamanho, Sort.by("nome", "id"));
        Page<ClienteResponse> resultado = clientes.buscar(nome, celular, pedido);

        return new ClientePaginaResponse(
                resultado.getContent(),
                resultado.getNumber(),
                resultado.getSize(),
                resultado.getTotalElements());
    }
}