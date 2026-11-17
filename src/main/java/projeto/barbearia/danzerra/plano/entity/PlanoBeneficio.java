package projeto.barbearia.danzerra.plano.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

import projeto.barbearia.danzerra.servico.entity.Servico;

@Embeddable
public class PlanoBeneficio {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "servico_id")
    private Servico servico;

    @Column(name = "nome_pendente", length = 120)
    private String nomePendente;

    @Column(nullable = false)
    private int quantidade;

    protected PlanoBeneficio() {
    }

    public PlanoBeneficio(Servico servico, int quantidade) {
        this.servico = servico;
        this.quantidade = quantidade;
    }

    public Long getServicoId() {
        return servico == null ? null : servico.getId();
    }

    public Servico getServico() {
        return servico;
    }

    public boolean temServicoAtivo() {
        return servico != null && servico.isAtivo();
    }

    public String getServicoNome() {
        return servico == null ? nomePendente : servico.getNome();
    }

    public int getQuantidade() {
        return quantidade;
    }
}
