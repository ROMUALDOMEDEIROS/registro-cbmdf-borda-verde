
export interface PresenceRecord {
  id: string;
  name: string;
  timestamp: number;
  latitude: number;
  longitude: number;
  distanceFromCenter: number;
  isSunday: boolean;
  status: 'valid' | 'invalid';
  dateString: string;
  timeString: string;
  dayOfWeek: string;
  monthKey: string; // YYYY-MM
}

export interface ValidationResult {
  allowed: boolean;
  reason?: string;
  details?: {
    distance?: number;
    isSunday?: boolean;
    day?: string;
    hour?: string;
  };
}

export const TRAINING_CONFIG = {
  CENTER: {
    lat: -15.833625441958903,
    lng: -47.93758403290985
  },
  RADIUS_METERS: 300,
  ALLOWED_DAYS: [0, 2, 4], // 0: Sunday, 2: Tuesday, 4: Thursday
  START_HOUR: 6,
  END_HOUR: 12,
  TIMEZONE: 'America/Sao_Paulo'
};

export const ATHLETES_LIST = [
  "Alessandra Moreira Borges",
  "Alessandro Borges Ferreira",
  "Alex da Silva Cunha",
  "Alexandre Tavares da Cunha",
  "Aline Venturelli Ferreira Antonio",
  "Ana Carolina Gomes Torres",
  "André Del Negro Vasconcelos Freitas",
  "André Luiz da Cunha Nascimento Dias de Sousa",
  "Antonio Claudio de Queiroz Dias",
  "Bruno Gomes de Lima",
  "Caíque Fernandes Flaeschen",
  "Camila Rodrigues Bezerra da Silva",
  "Cézar Souza Barbosa",
  "Charles de Moura Ferreira",
  "Danilo Mendonça Marçal",
  "Dhara Vieira Alcântara",
  "Diogo Sobral Glória",
  "Fábio Eduardo",
  "Fernando Dias de Moura",
  "Gabriel Vicente Soares",
  "Gilberto Marques da Silva",
  "Gilmar da Silva Mororó",
  "Hugo Joseir Souza e Silva",
  "Isabela Prado Bonfim",
  "Izabel Poline do Nascimento Camêlo",
  "Jair Dias Francisco",
  "Jefferson de Faria Lima",
  "Jorge Hamilton Heine e Silva",
  "Joviano Fernandes Borges",
  "Klesley Garcia Soares",
  "Lanuza Oliveira Vital",
  "Larissa Rodrigues Coqueiro",
  "Letícia Benedito Lima",
  "Levi Francisco Parente",
  "Luana Rocha Correto Vieira",
  "Luciano Benevides de Sousa",
  "Luciene Pereira de Queiroz",
  "Maiara Goveia de Sousa",
  "Marcel Garcia Cardoso",
  "Maria Aparecida Dantas",
  "Mário Pedro Baptista dos Santos",
  "Natalia Britto Rocha",
  "Paula Cristina de Deus Dini",
  "Pedro Dias Boa Sorte",
  "Pedro Eliton Peres",
  "Pedro Henrique Araujo Dias",
  "Rafael de Morais Garay",
  "Rafael Vinicius Vilela",
  "Renan Victor Cavalcante da Mata",
  "Romualdo Lima de Medeiros",
  "Rômullo Sanches Lima Fontenele",
  "Ronaldo Lima de Medeiros",
  "Rosimar Antonio Ricardo",
  "Sílvia de Araújo Jácomo",
  "Taiana de Andrade Pereira",
  "Thiago Sampaio Silva",
  "Tula Andrelina Lopes da Costa",
  "Uendel Dourado Gomes",
  "Vanessa Araújo Dias",
  "Wesley Sol da Silva"
];
