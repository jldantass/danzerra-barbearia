package projeto.barbearia.danzerra.cliente.exception;

public class ClienteNaoEncontradoException extends RuntimeException {

    public ClienteNaoEncontradoException(Long id) {
        super("Cliente de ID " + id + " não encontrado.");
    }
}