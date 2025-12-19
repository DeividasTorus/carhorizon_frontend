import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';

const COLORS = {
    bg: '#020617',
    text: '#e5e7eb',
    textMuted: '#9ca3af',
    textHint: '#6b7280',
    border: '#1f2937',
    cardBg: '#02081f',
};

const PrivacyPolicy = () => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Privacy Policy</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <Text style={styles.title}>Your privacy matters</Text>
                    <Text style={styles.text}>
                        We respect your privacy and are committed to protecting your personal data.
                        This Privacy Policy explains how we collect, use, and safeguard your information
                        when you use our application.
                    </Text>

                    <Text style={styles.subtitle}>Information we collect</Text>
                    <Text style={styles.text}>
                        • Account information (email address){'\n'}
                        • Usage data to improve app performance{'\n'}
                        • Technical data such as device type and app version
                    </Text>

                    <Text style={styles.subtitle}>How we use your data</Text>
                    <Text style={styles.text}>
                        Your data is used to provide and improve our services, ensure security,
                        and communicate important updates.
                    </Text>

                    <Text style={styles.subtitle}>Data security</Text>
                    <Text style={styles.text}>
                        We apply industry-standard security measures to protect your information
                        from unauthorized access or disclosure.
                    </Text>

                    <Text style={styles.subtitle}>Contact</Text>
                    <Text style={styles.text}>
                        If you have any questions regarding this Privacy Policy,
                        please contact our support team.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
        paddingHorizontal: 16,
        paddingTop: 18,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 14,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.cardBg,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.text,
    },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.cardBg,
        padding: 14,
        marginBottom: 24,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textMuted,
        marginTop: 14,
        marginBottom: 4,
    },
    text: {
        fontSize: 13,
        lineHeight: 20,
        color: COLORS.textHint,
    },
});

export default PrivacyPolicy;
