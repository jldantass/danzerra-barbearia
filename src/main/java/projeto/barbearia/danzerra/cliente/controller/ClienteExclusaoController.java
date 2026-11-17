package projeto.barbearia.danzerra.cliente.controller;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import projeto.barbearia.danzerra.cliente.service.ClienteService;

@RestController
@RequestMapping("/api/apagar_cliente")
public class ClienteExclusaoController {

    private final ClienteService clientes;

    public ClienteExclusaoController(ClienteService clientes) {
        this.clientes = clientes;
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        clientes.excluir(id);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail clienteComVinculos() {
        return ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT, "O cliente possui registros vinculados e não pode ser apagado.");
    }
}
