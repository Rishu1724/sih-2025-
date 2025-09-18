import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Colors, Gradients } from '../../constants/colors';
import CustomCard from '../../components/CustomCard';
import { getAthletes } from '../../services/FirebaseService';

const AthleteListScreen = ({ navigation }) => {
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAthletes();
  }, []);

  const fetchAthletes = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const athletesData = await getAthletes();
      setAthletes(athletesData);
    } catch (error) {
      console.error('Error fetching athletes:', error);
      Alert.alert('Error', 'Failed to fetch athletes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchAthletes(true);
  };

  const renderAthleteItem = ({ item }) => (
    <CustomCard style={styles.athleteCard}>
      <View style={styles.athleteHeader}>
        <View style={styles.athleteInfo}>
          <MaterialCommunityIcons 
            name="account" 
            size={24} 
            color={Colors.primary} 
          />
          <View style={styles.athleteText}>
            <Text style={styles.athleteName}>{item.name}</Text>
            <Text style={styles.athleteDetails}>
              {item.age} years • {item.gender?.toUpperCase()}
            </Text>
          </View>
        </View>
        <MaterialCommunityIcons 
          name="chevron-right" 
          size={24} 
          color={Colors.gray} 
        />
      </View>
      
      <View style={styles.athleteDetailsContainer}>
        <View style={styles.detailRow}>
          <MaterialCommunityIcons 
            name="map-marker" 
            size={16} 
            color={Colors.gray} 
          />
          <Text style={styles.detailText}>
            {item.district}, {item.state}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <MaterialCommunityIcons 
            name="email" 
            size={16} 
            color={Colors.gray} 
          />
          <Text style={styles.detailText}>{item.email}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <MaterialCommunityIcons 
            name="phone" 
            size={16} 
            color={Colors.gray} 
          />
          <Text style={styles.detailText}>{item.phone}</Text>
        </View>
      </View>
    </CustomCard>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={Gradients.primary} style={styles.headerGradient}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <MaterialCommunityIcons
              name="account-group"
              size={32}
              color={Colors.white}
            />
            <Text style={styles.headerTitle}>Athlete Directory</Text>
            <Text style={styles.headerSubtitle}>
              Manage all registered athletes
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {athletes.length === 0 && !loading ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="account-group-outline"
              size={64}
              color={Colors.gray}
            />
            <Text style={styles.emptyTitle}>No Athletes Found</Text>
            <Text style={styles.emptyText}>
              Register athletes to see them in the directory
            </Text>
            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => navigation.navigate('AthleteRegistration')}
            >
              <Text style={styles.registerButtonText}>Register Athlete</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={athletes}
            renderItem={renderAthleteItem}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Colors.primary]}
              />
            }
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerGradient: {
    paddingBottom: 30,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
    marginTop: 5,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
    marginTop: -20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.gray,
    marginTop: 8,
    textAlign: 'center',
  },
  registerButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 20,
  },
  registerButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 20,
  },
  athleteCard: {
    marginBottom: 16,
    padding: 16,
  },
  athleteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  athleteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  athleteText: {
    marginLeft: 12,
  },
  athleteName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  athleteDetails: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 2,
  },
  athleteDetailsContainer: {
    marginTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 8,
  },
});

export default AthleteListScreen;