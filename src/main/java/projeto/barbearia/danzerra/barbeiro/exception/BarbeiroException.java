package projeto.barbearia.danzerra.barbeiro.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class BarbeiroException extends ResponseStatusException {

    public BarbeiroException(HttpStatus status, String mensagem) {
        super(status, mensagem);
    }
}
