import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import React, { forwardRef } from 'react';
import { StyleSheet } from 'react-native';

const Map = forwardRef((props, ref) => {
    return (
        <MapView
            ref={ref}
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            {...props}
        >
            {props.children}
        </MapView>
    );
});

const styles = StyleSheet.create({
    map: {
        width: '100%',
        height: '100%',
    },
});

export { Marker };
export default Map;
