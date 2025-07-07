// geocodificacao.service.ts
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class GeocodificacaoService {
    async buscarCoordenadas(endereco: string): Promise<{ lat: number; lon: number } | null> {
        try {
            const response = await axios.get('https://nominatim.openstreetmap.org/search', {
                params: {
                    q: endereco,
                    format: 'json',
                    addressdetails: 1,
                    limit: 1
                },
                headers: {
                    'User-Agent': 'MeuSistemaDeMonitoramento/1.0'
                }
            });

            if (response.data.length > 0) {
                const { lat, lon } = response.data[0];
                return { lat: parseFloat(lat), lon: parseFloat(lon) };
            }

            return null;
        } catch (err) {
            console.error('Erro ao buscar coordenadas:', err);
            return null;
        }
    }

    
}
