import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  StyleSheet,
  Dimensions,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { File as ExpoFile, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useJaap } from '../context/JaapContext';
import { BackupData } from '../db/database';

interface BackupRestoreSheetProps {
  open: boolean;
  onClose: () => void;
}

export function BackupRestoreSheet({ open, onClose }: BackupRestoreSheetProps) {
  const { createBackup, restoreBackup, jaapData, totalLifetime } = useJaap();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const slideAnim = useRef(new Animated.Value(500)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const totalDays = Object.keys(jaapData).length;

  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 30,
          stiffness: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 500,
          damping: 30,
          stiffness: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [open]);

  async function handleExport() {
    try {
      setIsExporting(true);
      const data = await createBackup();
      const jsonStr = JSON.stringify(data, null, 2);

      const today = new Date().toISOString().split('T')[0];
      const fileName = `ram_naam_backup_${today}.json`;
      const file = new ExpoFile(Paths.cache, fileName);

      file.write(jsonStr);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Save Ram Naam Backup',
          UTI: 'public.json',
        });
      } else {
        Alert.alert('Backup Created', `File saved to: ${file.uri}`);
      }
    } catch (error) {
      console.warn('Export failed:', error);
      Alert.alert('Export Failed', 'Could not create backup. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }

  async function handleImport() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      setIsImporting(true);
      const fileUri = result.assets[0].uri;
      const pickedFile = new ExpoFile(fileUri);
      const jsonStr = await pickedFile.text();

      let data: BackupData;
      try {
        data = JSON.parse(jsonStr);
      } catch {
        Alert.alert('Invalid File', 'The selected file is not a valid backup file.');
        setIsImporting(false);
        return;
      }

      // Validate backup structure
      if (!data.jaapData || typeof data.jaapData !== 'object') {
        Alert.alert('Invalid Backup', 'This file does not contain valid Ram Naam data.');
        setIsImporting(false);
        return;
      }

      const entryCount = Object.keys(data.jaapData).length;
      const totalCount = Object.values(data.jaapData).reduce((s, v) => s + v, 0);
      const baseCount = data.lifetimeBase || 0;

      Alert.alert(
        '🙏 Restore Backup?',
        `This backup contains:\n\n` +
          `• ${entryCount} day(s) of records\n` +
          `• ${(totalCount + baseCount).toLocaleString()} total Naam Jaap\n` +
          `• Exported: ${data.exportedAt ? new Date(data.exportedAt).toLocaleDateString() : 'Unknown'}\n\n` +
          `⚠️ This will REPLACE all current data.`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setIsImporting(false) },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: async () => {
              try {
                await restoreBackup(data);
                Alert.alert('✅ Restored!', 'Your data has been successfully restored.');
                onClose();
              } catch (error) {
                console.warn('Restore failed:', error);
                Alert.alert('Restore Failed', 'Could not restore from backup. Please try again.');
              } finally {
                setIsImporting(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.warn('Import failed:', error);
      Alert.alert('Import Failed', 'Could not read the backup file. Please try again.');
      setIsImporting(false);
    }
  }

  if (!open) return null;

  return (
    <Modal transparent visible={open} animationType="none" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Drag handle */}
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Backup & Restore</Text>
          <Text style={styles.subtitle}>
            Protect your Naam Jaap data from being lost
          </Text>

          {/* Current data summary */}
          <View style={styles.summaryBox}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{totalDays}</Text>
              <Text style={styles.summaryLabel}>Days Tracked</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {totalLifetime >= 100000
                  ? (totalLifetime / 100000).toFixed(1) + 'L'
                  : totalLifetime.toLocaleString()}
              </Text>
              <Text style={styles.summaryLabel}>Total Jaap</Text>
            </View>
          </View>

          {/* Create Backup Button */}
          <TouchableOpacity
            onPress={handleExport}
            activeOpacity={0.8}
            disabled={isExporting}
            style={styles.actionBtnWrap}
          >
            <LinearGradient
              colors={['#FF6F00', '#FF9800']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionBtn}
            >
              {isExporting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Create Backup</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.actionHint}>
            Saves a .json file you can share or keep safe
          </Text>

          {/* Restore Button */}
          <TouchableOpacity
            onPress={handleImport}
            activeOpacity={0.7}
            disabled={isImporting}
            style={styles.restoreBtn}
          >
            {isImporting ? (
              <ActivityIndicator color="#FF6F00" size="small" />
            ) : (
              <>
                <Ionicons name="cloud-download-outline" size={20} color="#FF6F00" />
                <Text style={styles.restoreBtnText}>Restore from Backup</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Warning */}
          <View style={styles.warningBox}>
            <Ionicons name="information-circle" size={16} color="#9E9E9E" style={{ marginTop: 1 }} />
            <Text style={styles.warningText}>
              Keep your backup file safe! If you clear app data or uninstall, you'll need this file to restore your records.
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 20,
  },
  handleRow: {
    alignItems: 'center',
    marginBottom: 18,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: '#212121',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 20,
  },
  // Summary
  summaryBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF8F0',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,111,0,0.12)',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(255,111,0,0.15)',
    marginVertical: 2,
  },
  summaryValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: '#FF6F00',
    lineHeight: 24,
  },
  summaryLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#9E9E9E',
    marginTop: 2,
  },
  // Action buttons
  actionBtnWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#FF6F00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  actionBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  actionHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#BDBDBD',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FF6F00',
    backgroundColor: 'rgba(255,111,0,0.04)',
    marginBottom: 16,
  },
  restoreBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: '#FF6F00',
  },
  // Warning
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  warningText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#757575',
    lineHeight: 16,
    flex: 1,
  },
});
