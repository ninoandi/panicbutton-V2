<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class EmergencyMapController extends Controller
{
    public function nearby(Request $request)
    {
        $latitude = $request->query('lat');
        $longitude = $request->query('lng');

        if (!$latitude || !$longitude) {
            return response()->json([
                'success' => false,
                'message' => 'Latitude dan longitude diperlukan'
            ], 400);
        }

        $radius = 3000;

        $query = <<<OVERPASS
            [out:json][timeout:25];

            (
                node["amenity"="hospital"](around:$radius,$latitude,$longitude);
                way["amenity"="hospital"](around:$radius,$latitude,$longitude);
                relation["amenity"="hospital"](around:$radius,$latitude,$longitude);

                node["amenity"="clinic"](around:$radius,$latitude,$longitude);
                way["amenity"="clinic"](around:$radius,$latitude,$longitude);
                relation["amenity"="clinic"](around:$radius,$latitude,$longitude);

                node["amenity"="police"](around:$radius,$latitude,$longitude);
                way["amenity"="police"](around:$radius,$latitude,$longitude);
                relation["amenity"="police"](around:$radius,$latitude,$longitude);

                node["amenity"="fire_station"](around:$radius,$latitude,$longitude);
                way["amenity"="fire_station"](around:$radius,$latitude,$longitude);
                relation["amenity"="fire_station"](around:$radius,$latitude,$longitude);
            );

            out center;
            OVERPASS;

        try {

            $response = Http::timeout(60)
                ->withHeaders([
                    'Content-Type' =>
                        'application/x-www-form-urlencoded',

                    'Accept' =>
                        'application/json',

                    'User-Agent' =>
                        'PanicButtonEmergencyMap/1.0'
                ])
                ->withBody(
                    'data=' . urlencode($query),
                    'application/x-www-form-urlencoded'
                )
                ->post(
                    'https://overpass-api.de/api/interpreter'
                );


            if (!$response->successful()) {

                return response()->json([
                    'success' => false,

                    'message' =>
                        'Gagal mengambil data dari Overpass API',

                    'status' =>
                        $response->status(),

                    'response' =>
                        $response->body()
                ], 500);

            }


            $data = $response->json();


            $facilities = collect(
                $data['elements'] ?? []
            )
            ->map(function ($item) {

                $lat =
                    $item['lat']
                    ?? $item['center']['lat']
                    ?? null;

                $lng =
                    $item['lon']
                    ?? $item['center']['lon']
                    ?? null;


                return [

                    'id' =>
                        $item['type'] . '-' . $item['id'],

                    'name' =>
                        $item['tags']['name']
                        ?? 'Instansi Darurat',

                    'type' =>
                        $item['tags']['amenity']
                        ?? 'other',

                    'lat' => $lat,

                    'lng' => $lng,

                    'address' =>
                        $item['tags']['addr:street']
                        ?? $item['tags']['addr:full']
                        ?? '-'

                ];

            })
            ->filter(function ($facility) {

                return
                    $facility['lat'] !== null
                    &&
                    $facility['lng'] !== null;

            })
            ->values();


            return response()->json([

                'success' => true,

                'total' => $facilities->count(),

                'data' => $facilities

            ]);


        } catch (\Exception $e) {

            return response()->json([

                'success' => false,

                'message' =>
                    'Terjadi kesalahan saat mengambil data instansi',

                'error' =>
                    $e->getMessage()

            ], 500);

        }
    }
}