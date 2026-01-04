import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, Platform, SafeAreaView, Linking, AppState } from 'react-native';
import * as Location from 'expo-location';
import Map, { Marker } from './components/Map';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  // Status: 'idle', 'permissionDenied', 'servicesDisabled', 'error', 'success'
  const [status, setStatus] = useState('idle');
  const mapRef = useRef(null);
  const appState = useRef(AppState.currentState);

  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Auto-fetch on startup & AppState changes
  useEffect(() => {
    checkAndFetchLocation(true);

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        checkAndFetchLocation(false);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const checkAndFetchLocation = async (isStartup = false) => {
    if (loading) return;

    setLoading(true);
    setErrorMsg(null);
    if (!location) setStatus('idle');

    try {
      // Parallelize Permissions and Services check for speed
      const [permResult, serviceEnabledInitial] = await Promise.all([
        Location.getForegroundPermissionsAsync(),
        Location.hasServicesEnabledAsync()
      ]);

      // 1. Check Permissions
      let { status: permStatus, canAskAgain } = permResult;

      if (permStatus !== 'granted') {
        if (canAskAgain || isStartup) {
          const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
          if (newStatus !== 'granted') {
            setStatus('permissionDenied');
            setErrorMsg('Location permission denied');
            setLoading(false);
            return;
          }
        } else {
          setStatus('permissionDenied');
          setErrorMsg('Location permission denied');
          setLoading(false);
          return;
        }
      }

      // 2. Check Services (GPS)
      // Note: If permissions were just granted, we might need to re-check services on some Android versions, 
      // but usually the parallel check is fine. If it was disabled, we try to enable.
      let serviceEnabled = serviceEnabledInitial;
      if (!serviceEnabled) {
        if (!isStartup && Platform.OS === 'android') {
          try {
            await Location.enableNetworkProviderAsync();
            const enabled = await Location.hasServicesEnabledAsync();
            if (!enabled) {
              setStatus('servicesDisabled');
              setErrorMsg('Location services disabled');
              setLoading(false);
              return;
            }
            serviceEnabled = enabled; // Update serviceEnabled if successfully enabled
          } catch (e) {
            // Failed/Cancelled
          }
        } else {
          setStatus('servicesDisabled');
          setErrorMsg('Location services disabled');
          setLoading(false);
          return;
        }
      }

      // If we got here, we are good to go!
      setStatus('idle');
      await fetchLocationData();

    } catch (error) {
      console.error(error);
      setStatus('error');
      setErrorMsg('Error fetching location');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationData = async () => {
    let locationFound = false;

    // Try last known first - FASTEST
    try {
      let lastKnown = await Location.getLastKnownPositionAsync({
        maxAge: 60000, // Accept location up to 1 min old
        requiredAccuracy: 500 // Accept rough accuracy
      });
      if (lastKnown) {
        updateLocationState(lastKnown);
        setStatus('success');
        locationFound = true;
        setLoading(false); // Stop spinner immediately for perceived speed
      }
    } catch (e) { /* ignore */ }

    // Try current position - ACCURATE
    // If we already found a location (last known), we still fetch a better one but without blocking UI?
    // User wants "fast". If we showed data, we are good.
    // Let's fetch current to refine, but if we already showed something, the user feels it's "fast".
    try {
      let current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        maximumAge: 10000, // Accept cached location up to 10s old
        timeout: 5000
      });
      if (current) {
        updateLocationState(current);
        setStatus('success');
        locationFound = true;
      }
    } catch (e) {
      if (!locationFound) throw e;
    }
  };

  const updateLocationState = (result) => {
    if (!result || !result.coords) return;
    setLocation(result.coords);
    const newRegion = {
      latitude: result.coords.latitude,
      longitude: result.coords.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };
    setRegion(newRegion);
    if (mapRef.current && mapRef.current.animateToRegion && Platform.OS !== 'web') {
      mapRef.current.animateToRegion(newRegion, 500);
    }
  };

  const handleOpenSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Section */}
      <View style={styles.topSection}>
        <View style={styles.header}>
          <Ionicons name="location" size={24} color="#007AFF" />
          <Text style={styles.headerTitle}>GeoTracker</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current Coordinates</Text>

          <View style={styles.coordsContainer}>
            <View style={styles.coordItem}>
              <Text style={styles.coordLabel}>LATITUDE</Text>
              <Text style={styles.coordValue}>
                {location ? location.latitude.toFixed(6) : '--.------'}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.coordItem}>
              <Text style={styles.coordLabel}>LONGITUDE</Text>
              <Text style={styles.coordValue}>
                {location ? location.longitude.toFixed(6) : '--.------'}
              </Text>
            </View>
          </View>

          {/* Actionable Error UI */}
          {!loading && status === 'permissionDenied' && (
            <TouchableOpacity style={styles.actionError} onPress={handleOpenSettings}>
              <Ionicons name="settings-outline" size={16} color="#d9534f" />
              <Text style={styles.actionErrorText}>Permission denied. Tap to open Settings.</Text>
            </TouchableOpacity>
          )}

          {!loading && status === 'servicesDisabled' && (
            <TouchableOpacity style={styles.actionError} onPress={() => checkAndFetchLocation(false)}>
              <Ionicons name="location-outline" size={16} color="#f0ad4e" />
              <Text style={[styles.actionErrorText, { color: '#f0ad4e' }]}>Location is off. Tap to retry.</Text>
            </TouchableOpacity>
          )}

          {!loading && status === 'error' && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMsg || 'Unknown error'}</Text>
            </View>
          )}

        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={() => checkAndFetchLocation(false)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="navigate" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>
                {status === 'success' ? 'Update Location' : 'Find My Location'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <Map
          ref={mapRef}
          region={region}
        >
          {location && (
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title="You are here"
              pinColor="#007AFF"
            />
          )}
        </Map>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    paddingTop: Platform.OS === 'android' ? 30 : 0
  },
  topSection: {
    flex: 0.45,
    backgroundColor: '#F7F9FC',
    padding: 20,
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 16,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  coordsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  coordItem: {
    flex: 1,
    alignItems: 'center',
  },
  coordLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C7C7CC',
    marginBottom: 4,
  },
  coordValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    fontVariant: ['tabular-nums'],
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 10,
  },
  actionError: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
  },
  actionErrorText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#d9534f',
  },
  errorContainer: {
    marginTop: 10,
    padding: 5,
    alignItems: 'center'
  },
  errorText: {
    color: '#dc3545',
    fontSize: 13,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: '#A0C4FF',
    shadowOpacity: 0.1,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSection: {
    flex: 0.55,
    borderRadius: 30, // Rounded top corners for map container look
    overflow: 'hidden',
    backgroundColor: '#E5E5EA',
    borderTopWidth: 1,
    borderTopColor: '#D1D1D6',
  },
});
