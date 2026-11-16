package projeto.barbearia.danzerra.servico.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class ServicoNaoEncontradoException extends RuntimeException {

    public ServicoNaoEncontradoException(Long id) {
        super("Serviço de ID " + id + " não encontrado.");
    }
}
