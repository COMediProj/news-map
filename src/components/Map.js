import React, { useRef, useEffect, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import ReactDOM from 'react-dom';
import Tooltip from './Tooltip';
import Button from 'react-bootstrap/Button';
// import Legend from './Legend';

mapboxgl.accessToken =
  'pk.eyJ1IjoiY29tZWRpcHJvaiIsImEiOiJjbWlwMmYzYm4wN3RtM2RvdnIwOGE5ZXcwIn0.bGtKveJIx79R82fGs365lA';

const Map = (props) => {
  const mapContainerRef = useRef(null);
  const [mapObj, setMapObj] = useState(null);
  const popupRef = useRef(new mapboxgl.Popup({ offset: 15 }));
  const { source, fill } = props;
  const isMobile = window.innerWidth <= 820 ? true: false;
  // eslint-disable-next-line
  const center = [-105.358887, 39.113014];
  const zoom = isMobile ? 5 : 6;
  const height = isMobile ? 300 : 450;
  // const bounds = [
  //   [36.34551832917399, -109.85188785617123], // southwestern corner of the bounds
  //   [41.77721285520039, -100.80719442257701] // northeastern corner of the bounds
  // ].map(d => d.reverse());

  // const maxBounds = [
  //   [36.3435854367265, -109.85390841448573], // southwestern corner of the bounds
  //   [41.77721285520039, -100.80719442257701] // northeastern corner of the bounds
  // ].map(d => d.reverse());

  // Initialize map when component mounts
  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v10',
      center,
      zoom,
      minZoom: Math.min(zoom, 5),
      maxZoom: 8,
      // maxBounds, 
    });

    // map.fitBounds(bounds);

    let hoveredStateId = null;

    const resetFeature = (id) => {
      map.removeFeatureState({
        source: 'colorado',
        id: id
      });
    };

    map.on('load', () => {
      map.addSource('colorado', {
        type: 'geojson',
        data: source,
        promoteId: 'AFFGEOID',
        // generateId: true,
      });

      map.addLayer({
        id: 'colorado',
        type: 'fill',
        source: 'colorado',
        paint: fill.paint,
      });

      console.log(map.getZoom())

      setMapObj(map);

      // // change cursor to pointer when user hovers over a clickable feature
      // map.on('mouseenter', e => {
      //   if (e.features.length) {
      //     map.getCanvas().style.cursor = 'pointer';
      //   }
      // });

      // reset cursor to default when user is no longer hovering over a clickable feature
      map.on('mouseout', 'colorado', () => {
        map.getCanvas().style.cursor = '';
        // resetFeature(hoveredStateId);
        
        if (hoveredStateId) {
          resetFeature(hoveredStateId);
          popupRef.current.remove();  
        }
      });

      // add tooltip when users mouse move over a point
      map.on('mousemove', 'colorado', e => {
        const features = map.queryRenderedFeatures(e.point);
        
        if (features.length > 0) {
          map.getCanvas().style.cursor = 'pointer';
          
          const feature = features[0];
          
          // create popup node
          const popupNode = document.createElement('div');
          ReactDOM.render(<Tooltip feature={feature} />, popupNode);
          
          popupRef.current
            .setLngLat(e.lngLat)
            .setDOMContent(popupNode)
            .addTo(map);

          // props.passData(feature);

          if (hoveredStateId && feature.properties.total_sources > 0) {
            resetFeature(hoveredStateId);
          }
          hoveredStateId = feature.id;

          map.setFeatureState({
            source: 'colorado',
            id: hoveredStateId,
          },
          {
            hover: true,
          });
        }
      });

      map.on('click', 'colorado', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['colorado'],
        });
        
        if (features.length > 0) {
          const feature = features[0];
          
          // create popup node
          const popupNode = document.createElement('div');
          ReactDOM.render(<Tooltip feature={feature} />, popupNode);
          
          popupRef.current
            .setLngLat(e.lngLat)
            .setDOMContent(popupNode)
            .addTo(map);

          props.passData(feature);

          if (hoveredStateId && feature.properties.total_sources > 0) {
            resetFeature(hoveredStateId);
          }
          hoveredStateId = feature.id;

          map.setFeatureState({
            source: 'colorado',
            id: hoveredStateId,
          },
          {
            hover: true,
          });
        }
      });

      popupRef.current.on('close', () => {
        if (hoveredStateId) {
          resetFeature(hoveredStateId);
        }
      });
    });

    // Clean up on unmount
    return () => map.remove();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const resetZoom = useCallback((e) => {
    // console.log(e);
    // console.log(mapObj);
    // console.log(mapObj.getZoom());
    // console.log(mapObj.getMinZoom());
    // console.log(mapObj.getMaxZoom());
    // console.log(mapObj.getMaxBounds());
    mapObj.setZoom(zoom);
    mapObj.jumpTo({ center });
  }, [ mapObj, zoom, center ]);

  return (
    <div className='map'>
      <div className='map__container' ref={mapContainerRef} style={{width: '100%', height: height}} />
      <Button onClick={ resetZoom } variant="outline-dark" className='map__reset filter-table-btn'>Reset view</Button>
    </div>
  );
};

export default Map;