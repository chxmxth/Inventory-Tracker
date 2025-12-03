import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Building2, Save, ShieldCheck, X, ChevronRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrencySymbol } from '@/constants/currency';

const SETTINGS_KEY = '@inventory_settings';

interface Settings {
  companyName: string;
  currency: string;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [companyName, setCompanyName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsData = await AsyncStorage.getItem(SETTINGS_KEY);
      if (settingsData) {
        const settings: Settings = JSON.parse(settingsData);
        setCompanyName(settings.companyName || '');
        setCurrency(settings.currency || 'USD');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!companyName.trim()) {
      Alert.alert('Error', 'Please enter a company name');
      return;
    }

    setIsSaving(true);
    try {
      const settings: Settings = {
        companyName: companyName.trim(),
        currency,
      };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Customize your invoice details</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Building2 size={20} color="#6366F1" />
            <Text style={styles.sectionTitle}>Company Information</Text>
          </View>

          <Text style={styles.label}>Company Name</Text>
          <Text style={styles.description}>
            This name will appear on all your invoices
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your company name"
            value={companyName}
            onChangeText={setCompanyName}
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Currency</Text>
          <Text style={styles.description}>
            Select the currency for your transactions
          </Text>
          <TouchableOpacity
            style={styles.currencySelector}
            onPress={() => setShowCurrencyPicker(true)}
          >
            <Text style={styles.currencySelectorText}>{currency}</Text>
            <ChevronRight size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Save size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Settings</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ShieldCheck size={20} color="#6366F1" />
            <Text style={styles.sectionTitle}>Legal</Text>
          </View>

          <TouchableOpacity
            style={styles.privacyButton}
            onPress={() => setShowPrivacyPolicy(true)}
          >
            <Text style={styles.privacyButtonText}>Privacy Policy</Text>
            <ChevronRight size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Note</Text>
          <Text style={styles.infoText}>
            Your company name will replace the default branding on invoices. If no company name is provided, invoices will display &quot;Inventory Manager&quot; as the header.
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={showCurrencyPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCurrencyPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 20 }]}>
            <Text style={styles.modalTitle}>Select Currency</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCurrencyPicker(false)}
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.currencyListContainer}
          >
            {['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'MXN', 'BRL', 'ZAR', 'KRW', 'SGD', 'HKD', 'NZD', 'SEK', 'NOK', 'DKK', 'PLN', 'THB', 'IDR', 'MYR', 'PHP', 'AED', 'SAR', 'TRY', 'RUB', 'LKR'].map((curr) => (
              <TouchableOpacity
                key={curr}
                style={[
                  styles.currencyOption,
                  currency === curr && styles.currencyOptionSelected,
                ]}
                onPress={() => {
                  setCurrency(curr);
                  setShowCurrencyPicker(false);
                }}
              >
                <View style={styles.currencyOptionContent}>
                  <View style={styles.currencySymbolContainer}>
                    <Text
                      style={[
                        styles.currencySymbol,
                        currency === curr && styles.currencySymbolSelected,
                      ]}
                    >
                      {getCurrencySymbol(curr)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.currencyOptionText,
                      currency === curr && styles.currencyOptionTextSelected,
                    ]}
                  >
                    {curr}
                  </Text>
                </View>
                {currency === curr && (
                  <View style={styles.selectedIndicator} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={showPrivacyPolicy}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPrivacyPolicy(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 20 }]}>
            <Text style={styles.modalTitle}>Privacy Policy</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowPrivacyPolicy(false)}
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalContentContainer}
          >
            <Text style={styles.privacyText}>
              <Text style={styles.privacyHeading}>Privacy Policy for Inventory Manager by CATronics{"\n\n"}</Text>
              <Text style={styles.privacyLabel}>Last Updated: </Text>
              <Text>December 3, 2025{"\n\n"}</Text>

              <Text style={styles.privacyHeading}>Introduction{"\n\n"}</Text>
              <Text>CATronics (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how the Inventory Manager by CATronics mobile application (&quot;App&quot;) handles your information.{"\n\n"}</Text>

              <Text style={styles.privacyHeading}>Information We Collect{"\n\n"}</Text>
              <Text style={styles.privacySubheading}>Information Stored Locally on Your Device{"\n\n"}</Text>
              <Text>The App stores the following information locally on your device using secure local storage:{"\n\n"}</Text>
              <Text>• Product Information: Product names, categories, buying prices, selling prices, stock quantities, supplier names, and optional product images{"\n"}</Text>
              <Text>• Transaction Records: Sales, purchases, and inventory removal records including dates, quantities, prices, and optional notes{"\n"}</Text>
              <Text>• App Settings: Company name and other app configuration preferences{"\n\n"}</Text>

              <Text style={styles.privacySubheading}>Information We Do NOT Collect{"\n\n"}</Text>
              <Text>• We do NOT collect, transmit, or store any of your data on external servers{"\n"}</Text>
              <Text>• We do NOT track your location{"\n"}</Text>
              <Text>• We do NOT access your contacts, camera (except when you choose to add product images), or other sensitive device features without your explicit permission{"\n"}</Text>
              <Text>• We do NOT use analytics or tracking services{"\n"}</Text>
              <Text>• We do NOT sell, share, or rent your information to third parties{"\n\n"}</Text>

              <Text style={styles.privacyHeading}>How We Use Your Information{"\n\n"}</Text>
              <Text>All data entered into the App is stored locally on your device and is used solely to:{"\n\n"}</Text>
              <Text>• Manage your product inventory{"\n"}</Text>
              <Text>• Track sales, purchases, and inventory changes{"\n"}</Text>
              <Text>• Generate reports and invoices{"\n"}</Text>
              <Text>• Calculate profits and stock values{"\n"}</Text>
              <Text>• Display dashboard summaries{"\n\n"}</Text>

              <Text style={styles.privacyHeading}>Data Storage and Security{"\n\n"}</Text>
              <Text>• All data is stored locally on your device using industry-standard encryption through AsyncStorage{"\n"}</Text>
              <Text>• Your data remains on your device and is not transmitted to any external servers{"\n"}</Text>
              <Text>• You have full control over your data and can delete the App at any time to remove all stored information{"\n"}</Text>
              <Text>• We recommend that you use your device&apos;s built-in security features (passcode, biometric authentication) to protect access to your device and the App{"\n\n"}</Text>

              <Text style={styles.privacyHeading}>Data Sharing and Third Parties{"\n\n"}</Text>
              <Text>• We do NOT share your data with any third parties{"\n"}</Text>
              <Text>• The App operates entirely offline and does not require internet connectivity to function{"\n"}</Text>
              <Text>• No third-party analytics, advertising, or tracking services are used in the App{"\n\n"}</Text>

              <Text style={styles.privacyHeading}>Your Rights and Choices{"\n\n"}</Text>
              <Text>You have the right to:{"\n\n"}</Text>
              <Text>• Access all data stored in the App at any time{"\n"}</Text>
              <Text>• Modify or delete any products, transactions, or settings{"\n"}</Text>
              <Text>• Permanently delete all data by uninstalling the App from your device{"\n"}</Text>
              <Text>• Export data through the invoice/report generation features{"\n\n"}</Text>

              <Text style={styles.privacyHeading}>Children&apos;s Privacy{"\n\n"}</Text>
              <Text>The App does not specifically target children under the age of 13. We do not knowingly collect personal information from children under 13. The App is designed for business inventory management purposes.{"\n\n"}</Text>

              <Text style={styles.privacyHeading}>Changes to This Privacy Policy{"\n\n"}</Text>
              <Text>We may update this Privacy Policy from time to time. Any changes will be reflected in the &quot;Last Updated&quot; date at the top of this policy. We encourage you to review this Privacy Policy periodically for any updates.{"\n\n"}</Text>

              <Text style={styles.privacyHeading}>Data Retention{"\n\n"}</Text>
              <Text>Your data is retained locally on your device for as long as the App is installed. Uninstalling the App will permanently delete all locally stored data from your device.{"\n\n"}</Text>

              <Text style={styles.privacyHeading}>International Users{"\n\n"}</Text>
              <Text>Since all data is stored locally on your device, this App complies with data protection regulations including GDPR (General Data Protection Regulation) and CCPA (California Consumer Privacy Act) by design, as no personal data is collected, transmitted, or stored on external servers.{"\n\n"}</Text>

              <Text style={styles.privacyHeading}>Permissions{"\n\n"}</Text>
              <Text>The App may request the following permissions:{"\n\n"}</Text>
              <Text>• Storage (READ_EXTERNAL_STORAGE, WRITE_EXTERNAL_STORAGE): To save and retrieve locally stored inventory data and optionally store product images{"\n"}</Text>
              <Text>• Internet (INTERNET): For potential future updates and features (currently the app operates fully offline){"\n\n"}</Text>
              <Text>These permissions are used solely for the functionality described and no data is transmitted off your device.{"\n\n"}</Text>

              <Text style={styles.privacyHeading}>Consent{"\n\n"}</Text>
              <Text>By using the Inventory Manager by CATronics App, you consent to this Privacy Policy and agree to its terms.{"\n\n"}</Text>

              <Text style={styles.privacyImportant}>Important Note: </Text>
              <Text>This is an offline-first application. All your business data, including products, transactions, pricing, and financial information, remains private and secure on your device. We believe your business data belongs to you and should stay under your control.</Text>
            </Text>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContent: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 20,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#111827',
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  infoCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#4338CA',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#6366F1',
    lineHeight: 18,
  },
  privacyButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  privacyButtonText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500' as const,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 40,
  },
  privacyText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#374151',
  },
  privacyHeading: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
  },
  privacySubheading: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#111827',
  },
  privacyLabel: {
    fontWeight: '600' as const,
    color: '#111827',
  },
  privacyImportant: {
    fontWeight: '700' as const,
    color: '#111827',
  },
  currencySelector: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  currencySelectorText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500' as const,
  },
  currencyListContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  currencyOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
  },
  currencyOptionSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  currencyOptionContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  currencyOptionText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500' as const,
  },
  currencyOptionTextSelected: {
    color: '#6366F1',
    fontWeight: '600' as const,
  },
  selectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366F1',
  },
  currencySymbolContainer: {
    width: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  currencySymbolSelected: {
    color: '#6366F1',
  },
});
