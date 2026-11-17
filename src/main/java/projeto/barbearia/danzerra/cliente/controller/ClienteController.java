package projeto.barbearia.danzerra.cliente.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import projeto.barbearia.danzerra.cliente.dto.ClienteAtualizacaoRequest;
import projeto.barbearia.danzerra.cliente.dto.ClienteCadastroRequest;
import projeto.barbearia.danzerra.cliente.dto.ClientePaginaResponse;
import projeto.barbearia.danzerra.cliente.dto.ClienteResponse;
import projeto.barbearia.danzerra.cliente.service.ClienteService;

@RestController
@RequestMapping("/api")
public class ClienteController {

    private final ClienteService clientes;

    public ClienteController(ClienteService clientes) {
        this.clientes = clientes;
    }

    @PostMapping("/cadastrar_cliente")
    @ResponseStatus(HttpStatus.CREATED)
    public ClienteResponse cadastrar(@Valid @RequestBody ClienteCadastroRequest dados) {
        return clientes.cadastrar(dados);
    }

    @GetMapping("/clientes")
    public ClientePaginaResponse buscar(
            @RequestParam(defaultValue = "") String nome,
            @RequestParam(defaultValue = "") String celular,
            @RequestParam(defaultValue = "false") boolean planoAtivo,
            @RequestParam(defaultValue = "0") @Min(0) @Max(1_000_000) int pagina,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int tamanho) {
        PageRequest pedido = PageRequest.of(pagina, tamanho, Sort.by("nome", "id"));
        Page<ClienteResponse> resultado = clientes.buscar(nome, celular, planoAtivo, pedido);

        return new ClientePaginaResponse(
                resultado.getContent(),
                resultado.getNumber(),
                resultado.getSize(),
                resultado.getTotalElements());
    }

    @GetMapping("/clientes/{id}")
    public ClienteResponse buscarPorId(@PathVariable Long id) {
        return clientes.buscarPorId(id);
    }

    @PutMapping("/atualizar_cliente/{id}")
    public ClienteResponse atualizar(
            @PathVariable Long id,
            @Valid @RequestBody ClienteAtualizacaoRequest dados) {
        return clientes.atualizar(id, dados);
    }

    @DeleteMapping("/apagar_cliente/{id}")
    public ResponseEntity<ProblemDetail> excluir(@PathVariable Long id) {
        try {
            clientes.excluir(id);
            return ResponseEntity.noContent().build();
        } catch (DataIntegrityViolationException erro) {
            ProblemDetail problema = ProblemDetail.forStatusAndDetail(
                    HttpStatus.CONFLICT, "O cliente possui registros vinculados e não pode ser apagado.");
            return ResponseEntity.of(problema).build();
        }
    }
}
