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

const TermsOfUse = () => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Terms of Use</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <Text style={styles.title}>Terms & Conditions</Text>
                    <Text style={styles.text}>
                        By using this application, you agree to comply with and be bound by the
                        following terms and conditions.
                    </Text>

                    <Text style={styles.subtitle}>Use of the app</Text>
                    <Text style={styles.text}>
                        You agree to use the app only for lawful purposes and in a way that does
                        not infringe the rights of others.
                    </Text>

                    <Text style={styles.subtitle}>Accounts</Text>
                    <Text style={styles.text}>
                        You are responsible for maintaining the confidentiality of your account
                        credentials and all activities under your account.
                    </Text>

                    <Text style={styles.subtitle}>Termination</Text>
                    <Text style={styles.text}>
                        We reserve the right to suspend or terminate access to the app if these
                        terms are violated.
                    </Text>

                    <Text style={styles.subtitle}>Changes</Text>
                    <Text style={styles.text}>
                        Terms may be updated from time to time. Continued use of the app means
                        acceptance of the updated terms.
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

export default TermsOfUse;
