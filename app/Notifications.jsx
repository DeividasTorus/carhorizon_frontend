import React, { useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SectionList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';

const Notifications = () => {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const {
        notifications,
        fetchNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        notificationsLoading
    } = useAppContext();

    // Fetch notifications when screen opens
    useEffect(() => {
        console.log('📱 Notifications screen opened, fetching...');
        fetchNotifications();
    }, []);

    // Group notifications by time period and post
    const groupedNotifications = useMemo(() => {
        if (!notifications || notifications.length === 0) return [];

        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const last7Days = [];
        const last30Days = [];

        notifications.forEach(notification => {
            const createdAt = new Date(notification.created_at);
            if (createdAt >= sevenDaysAgo) {
                last7Days.push(notification);
            } else if (createdAt >= thirtyDaysAgo) {
                last30Days.push(notification);
            }
        });

        // Group by post_id and type for same action notifications
        const groupByPost = (notifs) => {
            const grouped = {};

            notifs.forEach(notif => {
                const key = `${notif.type}_${notif.post_id || 'follow'}`;
                if (!grouped[key]) {
                    grouped[key] = {
                        type: notif.type,
                        post_id: notif.post_id,
                        notifications: [],
                        latestTime: notif.created_at,
                        hasUnread: false,
                    };
                }
                grouped[key].notifications.push(notif);
                if (!notif.is_read) {
                    grouped[key].hasUnread = true;
                }
                // Keep latest time
                if (new Date(notif.created_at) > new Date(grouped[key].latestTime)) {
                    grouped[key].latestTime = notif.created_at;
                }
            });

            return Object.values(grouped).sort((a, b) =>
                new Date(b.latestTime) - new Date(a.latestTime)
            );
        };

        const sections = [];

        if (last7Days.length > 0) {
            sections.push({
                title: 'Paskutinės 7 dienos',
                data: groupByPost(last7Days),
            });
        }

        if (last30Days.length > 0) {
            sections.push({
                title: 'Paskutinės 30 dienų',
                data: groupByPost(last30Days),
            });
        }

        return sections;
    }, [notifications]);

    const handleNotificationGroupPress = async (group) => {
        // Mark all in group as read
        const unreadNotifs = group.notifications.filter(n => !n.is_read);
        for (const notif of unreadNotifs) {
            await markNotificationAsRead(notif.id);
        }

        // Navigate based on type
        switch (group.type) {
            case 'like':
            case 'comment':
                router.push({
                    pathname: '/PostDetail',
                    params: { postId: group.post_id }
                });
                break;
            case 'follow':
                router.push('/Profile');
                break;
            default:
                break;
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'like':
                return { name: 'heart', color: '#ef4444' };
            case 'comment':
                return { name: 'chatbubble', color: '#38bdf8' };
            case 'follow':
                return { name: 'person-add', color: '#10b981' };
            default:
                return { name: 'notifications', color: '#94a3b8' };
        }
    };

    const getGroupedMessage = (group) => {
        const count = group.notifications.length;
        const firstActor = group.notifications[0].actor_name;

        if (count === 1) {
            const notif = group.notifications[0];
            return `${notif.actor_name} ${notif.message}`;
        }

        if (count === 2) {
            const secondActor = group.notifications[1].actor_name;
            switch (group.type) {
                case 'like':
                    return `${firstActor} ir ${secondActor} palaikino jūsų įrašą`;
                case 'comment':
                    return `${firstActor} ir ${secondActor} pakomentavo jūsų įrašą`;
                case 'follow':
                    return `${firstActor} ir ${secondActor} pradėjo sekti jus`;
                default:
                    return `${firstActor} ir ${secondActor}`;
            }
        }

        const othersCount = count - 1;
        switch (group.type) {
            case 'like':
                return `${firstActor} ir dar ${othersCount} palaikino jūsų įrašą`;
            case 'comment':
                return `${firstActor} ir dar ${othersCount} pakomentavo jūsų įrašą`;
            case 'follow':
                return `${firstActor} ir dar ${othersCount} pradėjo sekti jus`;
            default:
                return `${firstActor} ir dar ${othersCount}`;
        }
    };

    const getTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'Ką tik';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d`;
        return `${Math.floor(days / 7)}w`;
    };

    const renderNotificationGroup = ({ item: group }) => {
        const icon = getNotificationIcon(group.type);
        const message = getGroupedMessage(group);
        const timeAgo = getTimeAgo(group.latestTime);

        return (
            <TouchableOpacity
                style={[styles.notificationItem, group.hasUnread && styles.unreadItem]}
                onPress={() => handleNotificationGroupPress(group)}
            >
                <View style={[styles.iconContainer]}>
                    <Ionicons name={icon.name} size={24} color={icon.color} />
                </View>

                <View style={styles.notificationContent}>
                    <Text style={styles.notificationText}>{message}</Text>
                    <Text style={styles.notificationTime}>{timeAgo}</Text>
                </View>

                {group.hasUnread && <View style={styles.unreadDot} />}
            </TouchableOpacity>
        );
    };

    const renderSectionHeader = ({ section: { title } }) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="#475569" />
            <Text style={styles.emptyText}>Nėra pranešimų</Text>
            <Text style={styles.emptySubtext}>
                Kai kas nors palaikis jūsų įrašą ar pakomentavus, pamatysite pranešimus čia
            </Text>
        </View>
    );

    return (
        <View style={[styles.container]}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTitleGroup}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#e5e7eb" />
                    </TouchableOpacity>
                    <View style={styles.mainIconWrapper}>
                        <Ionicons name="notifications-outline" size={26} color="#38bdf8" />
                    </View>
                    <Text style={styles.headerTitle}>Pranešimai</Text>
                </View>
                <TouchableOpacity onPress={markAllNotificationsAsRead}>
                    <Text style={styles.markAllText}>Pažymėti viską</Text>
                </TouchableOpacity>
            </View>

            {/* Notifications List */}
            {notificationsLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#38bdf8" />
                </View>
            ) : groupedNotifications.length === 0 ? (
                renderEmpty()
            ) : (
                <SectionList
                    sections={groupedNotifications}
                    keyExtractor={(item, index) => `${item.type}_${item.post_id}_${index}`}
                    renderItem={renderNotificationGroup}
                    renderSectionHeader={renderSectionHeader}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    stickySectionHeadersEnabled={true}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    headerTitleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    backButton: {
        marginRight: 12,
        padding: 4,
    },
    mainIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 999,
        backgroundColor: 'rgba(56,189,248,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#e5e7eb',
    },
    markAllText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#38bdf8',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        flexGrow: 1,
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    unreadItem: {
        backgroundColor: '#1e293b20',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    notificationContent: {
        flex: 1,
    },
    notificationText: {
        fontSize: 14,
        color: '#e5e7eb',
        lineHeight: 20,
    },
    notificationAuthor: {
        fontWeight: '700',
        color: '#fff',
    },
    notificationTime: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 4,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ef4444',
        marginLeft: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#e5e7eb',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    sectionHeader: {
        backgroundColor: '#0b1120',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b',
    },
    sectionHeaderText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#e5e7eb',
    },
});

export default Notifications;
