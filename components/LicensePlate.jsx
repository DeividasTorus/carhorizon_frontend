import React from 'react';
import { StyleSheet, Text, ImageBackground } from 'react-native';

const LicensePlate = ({
  plate,
  width = 220,
  height = 60,
  borderRadius = 12,
  style,
  textStyle,
}) => {
  return (
    <ImageBackground
      source={require('../assets/LTPlates.png')}
      style={[
        styles.container,
        { width, height, borderRadius },
        style, // 👈 čia gali override'int margin, borderRadius ir t.t.
      ]}
      imageStyle={{ borderRadius }} // 👈 kad nuotrauka irgi turėtų tą patį radius
      resizeMode="stretch"
    >
      <Text
        style={[styles.text, textStyle]} // 👈 čia pilnai valdai fontSize, margin ir t.t.
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {plate}
      </Text>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  text: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 3,
  },
});

export default LicensePlate;
