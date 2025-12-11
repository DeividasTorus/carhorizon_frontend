// components/CachedAvatar.jsx
import React, { useEffect, useState } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { useAppContext } from '../context/AppContext';

const CachedAvatar = ({
  remoteUrl,
  size = 60,
  borderRadius = 15,
  placeholderInitial = 'A',
  style,
  textStyle,
}) => {
  const { getCachedAvatarUri } = useAppContext();
  const [uri, setUri] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const prepare = async () => {
      if (!remoteUrl) {
        if (isMounted) setUri(null);
        return;
      }

      try {
        const localUri = await getCachedAvatarUri(remoteUrl);
        if (isMounted) {
          setUri(localUri || remoteUrl);
        }
      } catch (e) {
        console.log('CachedAvatar error', e);
        if (isMounted) {
          setUri(remoteUrl);
        }
      }
    };

    prepare();

    return () => {
      isMounted = false;
    };
  }, [remoteUrl]);

  return (
    <View
      style={[
        styles.wrapper,
        {
          width: size,
          height: size,
          borderRadius,
        },
        style,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{
            width: size,
            height: size,
            borderRadius,
          }}
        />
      ) : (
        <Text
          style={[
            styles.initial,
            {
              fontSize: size * 0.4,
            },
            textStyle,
          ]}
        >
          {placeholderInitial}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  initial: {
    color: '#9ca3af',
    fontWeight: '700',
  },
});

export default CachedAvatar;
