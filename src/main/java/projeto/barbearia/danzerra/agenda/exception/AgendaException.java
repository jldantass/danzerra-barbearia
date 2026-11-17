package projeto.barbearia.danzerra.agenda.exception;

import org.springframework.http.HttpStatus;

public class AgendaException extends RuntimeException {

    private final HttpStatus status;

    public AgendaException(HttpStatus status, String mensagem) {
        super(mensagem);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
