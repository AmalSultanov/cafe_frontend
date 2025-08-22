declare global {
  interface Window {
    L: typeof L;
  }
}

declare namespace L {
  function map(id: string | HTMLElement, options?: MapOptions): Map;

  interface MapOptions {
    center?: LatLngExpression;
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    zoomControl?: boolean;
  }

  class Map {
    setView(center: LatLngExpression, zoom?: number): this;
    on(type: string, fn: Function): this;
    off(type: string, fn?: Function): this;
    addLayer(layer: Layer): this;
    removeLayer(layer: Layer): this;
    getCenter(): LatLng;
    getZoom(): number;
    remove(): this;
  }

  interface Layer {
    addTo(map: Map): this;
    remove(): this;
  }

  class Marker extends Layer {
    constructor(latlng: LatLngExpression, options?: MarkerOptions);
    setLatLng(latlng: LatLngExpression): this;
    getLatLng(): LatLng;
    bindPopup(content: string): this;
  }

  interface MarkerOptions {
    icon?: Icon;
    draggable?: boolean;
    title?: string;
  }

  class Icon {
    constructor(options: IconOptions);
  }

  interface IconOptions {
    iconUrl: string;
    iconSize?: [number, number];
    iconAnchor?: [number, number];
    popupAnchor?: [number, number];
  }

  function icon(options: IconOptions): Icon;

  namespace tileLayer {
    function openStreetMap(): TileLayer;
  }

  class TileLayer extends Layer {
    constructor(urlTemplate: string, options?: TileLayerOptions);
  }

  interface TileLayerOptions {
    attribution?: string;
    maxZoom?: number;
  }

  function tileLayer(urlTemplate: string, options?: TileLayerOptions): TileLayer;

  class LatLng {
    constructor(lat: number, lng: number);
    lat: number;
    lng: number;
  }

  type LatLngExpression = LatLng | [number, number] | { lat: number; lng: number };

  interface LeafletMouseEvent {
    latlng: LatLng;
    layerPoint: Point;
    containerPoint: Point;
    originalEvent: MouseEvent;
  }

  class Point {
    constructor(x: number, y: number);
    x: number;
    y: number;
  }
}

export {};
