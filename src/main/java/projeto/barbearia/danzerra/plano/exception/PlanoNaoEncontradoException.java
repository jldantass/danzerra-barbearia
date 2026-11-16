package projeto.barbearia.danzerra.plano.exception;

public class PlanoNaoEncontradoException extends RuntimeException {

    public PlanoNaoEncontradoException(Long id) {
        super("Plano de ID " + id + " não encontrado.");
    }
}
