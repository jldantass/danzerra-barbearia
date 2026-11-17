package projeto.barbearia.danzerra.planocliente.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import projeto.barbearia.danzerra.servico.entity.Servico;

@Entity
@Table(name = "planos_cliente_beneficios")
public class PlanoClienteBeneficio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "periodo_id", nullable = false)
    private PlanoCliente periodo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "servico_id", nullable = false)
    private Servico servico;

    @Column(nullable = false)
    private int cota;

    @Column(nullable = false)
    private int usados;

    protected PlanoClienteBeneficio() {
    }

    PlanoClienteBeneficio(PlanoCliente periodo, Servico servico, int cota) {
        this.periodo = periodo;
        this.servico = servico;
        this.cota = cota;
    }

    public Servico getServico() {
        return servico;
    }

    public int getCota() {
        return cota;
    }

    public int getUsados() {
        return usados;
    }

    public int getRestantes() {
        return Math.max(0, cota - usados);
    }
}
