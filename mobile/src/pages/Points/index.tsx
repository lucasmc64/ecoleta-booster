import React, { useState, useEffect } from 'react';
import Constants from 'expo-constants';
import { Feather as Icon } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SvgUri } from 'react-native-svg';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';

import api from '../../services/api';

interface Item {
    id: number;
    title: string;
    image_url: string;
}

interface Point {
    id: number;
    image: string;
    image_url: string;
    name: string;
    longitude: number;
    latitude: number;
}

interface Params {
    selectedUf: string,
    selectedCity: string,
}

const Points = () => {
    const [items, setItems] = useState<Item[]>([]);
    const [points, setPoints] = useState<Point[]>([]);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);

    const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0]);

    const navigation = useNavigation();
    const route = useRoute();

    const routeParams = route.params as Params;

    useEffect(() => {
        async function loadPosition() {
            const { status } = await Location.requestPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert('Oooops...', 'Precisamos de sua permissão para obter a localização.');
                return;
            }

            const location = await Location.getCurrentPositionAsync();

            const { latitude, longitude } = location.coords;

            setInitialPosition([
                latitude,
                longitude
            ]);
        }

        loadPosition();
    }, []);

    useEffect(() => {
        api.get('items').then((response) => {
            setItems(response.data);
        });
    }, []);

    useEffect(() => {
        api.get('points', {
            params: {
                city: routeParams.selectedCity,
                uf: routeParams.selectedUf,
                items: selectedItems
            }
        }).then((response) => {
            setPoints(response.data);
        });
    }, [selectedItems]);

    function handleNavigateBack() {
        navigation.goBack();
    }

    function handleNavigateToDetail(id: number) {
        navigation.navigate('Detail', { point_id: id });
    }

    function handleSelectItem(id: number) {
        const alreadySelected = selectedItems.findIndex((item) => item === id);

        if (alreadySelected >= 0) {
            const filteredItems = selectedItems.filter((item) => item !== id);

            setSelectedItems(filteredItems);
        } else {
            setSelectedItems([...selectedItems, id]);
        }
    }

    return (
        <>
            <View style={styles.container}>
                <TouchableOpacity style={styles.iconBackContainer} onPress={handleNavigateBack}>
                    <Icon name="log-out" style={styles.iconBack} size={24} color="#34CB79" />
                </TouchableOpacity>

                <Text style={styles.title}>
                    &#128515;
                    Bem vindo.
                </Text>

                <Text style={styles.description}>
                    Encontre no mapa um ponto de coleta.
                </Text>

                <View style={styles.mapContainer}>
                    {initialPosition[0] !== 0 && (
                        <MapView style={styles.map} initialRegion={{ latitude: initialPosition[0], longitude: initialPosition[1], latitudeDelta: 0.014, longitudeDelta: 0.014 }}>
                            {points.map((point) => (
                                <Marker key={String(point.id)} style={styles.mapMarker} onPress={() => handleNavigateToDetail(point.id)} coordinate={{ latitude: point.latitude, longitude: point.longitude }}>
                                    <View style={styles.mapMarkerContainer}>
                                        <Image style={styles.mapMarkerImage} source={{ uri: point.image_url }} />
                                        <Text style={styles.mapMarkerTitle}>{point.name}</Text>
                                    </View>
                                    <View style={styles.mapPinMarker} />
                                </Marker>
                            ))}
                        </MapView>
                    )}
                </View>
            </View>

            <View style={styles.itemsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 32 }} >

                    {items.map((item) => (
                        <TouchableOpacity key={String(item.id)} activeOpacity={0.55} style={[styles.itemButton, selectedItems.includes(item.id) ? styles.selectedItem : {}, items[items.length - 1].id === item.id ? styles.lastItem : {}]} onPress={() => handleSelectItem(item.id)}>
                            <LinearGradient colors={[selectedItems.includes(item.id) ? '#FFFFFF' : '#E1FAEC', '#E1FAEC']} style={styles.itemBackground}>
                                <SvgUri width={42} height={42} uri={item.image_url} />
                                <Text style={styles.itemTitle}>{item.title}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}

                </ScrollView>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 32,
        paddingTop: 20 + Constants.statusBarHeight,
    },

    title: {
        color: '#322153',
        fontSize: 20,
        fontFamily: 'Ubuntu_700Bold',
        marginTop: 24,
    },

    iconBackContainer: {
        width: 24,
    },

    iconBack: {
        alignSelf: "flex-start",
        transform: [
            { rotate: '180deg' }
        ],
    },

    description: {
        color: '#6C6C80',
        fontSize: 16,
        marginTop: 4,
        fontFamily: 'Roboto_400Regular',
    },

    mapContainer: {
        flex: 1,
        width: '100%',
        borderRadius: 10,
        overflow: 'hidden',
        marginTop: 16,
    },

    map: {
        width: '100%',
        height: '100%',
    },

    mapMarker: {
        width: 90,
        height: 80,
    },

    mapMarkerContainer: {
        width: 90,
        height: 70,
        backgroundColor: '#34CB79',
        flexDirection: 'column',
        borderRadius: 8,
        overflow: 'hidden',
        alignItems: 'center'
    },

    mapMarkerImage: {
        width: 90,
        height: 45,
        resizeMode: 'cover',
    },

    mapMarkerTitle: {
        flex: 1,
        fontFamily: 'Roboto_400Regular',
        color: '#FFF',
        fontSize: 13,
        lineHeight: 23,
    },

    mapPinMarker: {
        width: 10,
        height: 10,
        alignSelf: 'center',
        transform: [
            { rotate: '45deg' }
        ],
        marginTop: -(5 * Math.sqrt(2)),
        backgroundColor: '#34CB79',
        overflow: 'hidden',
    },

    itemsContainer: {
        flexDirection: 'row',
        marginTop: 16,
        marginBottom: 32,
    },

    itemButton: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#eee',
        height: 120,
        width: 120,
        borderRadius: 8,
        paddingTop: 20,
        marginRight: 8,
        alignItems: 'center',
        justifyContent: 'space-between',

        textAlign: 'center',
    },

    itemBackground: {
        height: '100%',
        width: '100%',
        borderRadius: 8,
        paddingHorizontal: 16,
        alignItems: 'center',
    },

    lastItem: {
        marginRight: 0,
    },

    selectedItem: {
        borderColor: '#34CB79',
        borderWidth: 2,
    },

    itemTitle: {
        fontFamily: 'Roboto_400Regular',
        textAlign: 'center',
        fontSize: 13,
    },
});

export default Points;