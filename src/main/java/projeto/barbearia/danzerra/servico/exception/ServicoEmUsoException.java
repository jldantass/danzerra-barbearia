package projeto.barbearia.danzerra.servico.exception;

public class ServicoEmUsoException extends RuntimeException {

    public ServicoEmUsoException(Long id, Throwable causa) {
        super("O serviço de ID " + id + " está vinculado a outros registros.", causa);
    }
}
