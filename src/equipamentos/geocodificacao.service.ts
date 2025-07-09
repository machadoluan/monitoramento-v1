// geocodificacao.service.ts
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class GeocodificacaoService {
    async buscarCoordenadas(endereco: string): Promise<{ lat: number; lon: number } | null> {
        try {
            const response = await axios.get('https://photon.komoot.io/api/', {
                params: {
                    q: endereco,
                    limit: 1
                }
            });

            if (response.data.features && response.data.features.length > 0) {
                const [lon, lat] = response.data.features[0].geometry.coordinates;
                return { lat, lon };
            }

            return null;
        } catch (err) {
            console.error('Erro ao buscar coordenadas:', err);
            return null;
        }
    }
}
