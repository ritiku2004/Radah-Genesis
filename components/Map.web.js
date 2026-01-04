import React, { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const Marker = () => null;

const Map = forwardRef((props, ref) => {
    // Simple fallback for web to ensure build passes and UI renders
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Map View on Web</Text>
            <Text style={styles.subtext}>(Requires Google Maps API Key or custom implementation)</Text>
            {props.region && (
                <View style={styles.debug}>
                    <Text>Lat: {props.region.latitude.toFixed(4)}</Text>
                    <Text>Lng: {props.region.longitude.toFixed(4)}</Text>
                </View>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e1e1e1',
    },
    text: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#666',
    },
    subtext: {
        fontSize: 14,
        color: '#888',
        marginTop: 5,
    },
    debug: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 5,
    }
});

export default Map;
