import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// For local development on a physical device, this needs to be the IP address of the machine
// running the FastAPI server. 
// e.g., 'http://192.168.1.100:8000/remove-background'
// For Android emulator it can be 'http://10.0.2.2:8000/remove-background'
// For iOS simulator it can be 'http://localhost:8000/remove-background'

const getApiUrl = () => {
    // Attempt to dynamically determine the local IP from Expo Constants
    // This is the IP of the machine running the Expo Metro bundler
    const hostUri = Constants?.expoConfig?.hostUri || Constants?.manifest?.debuggerHost || (Constants as any)?.manifest2?.extra?.expoGo?.debuggerHost;
    
    if (hostUri) {
        // hostUri is usually something like '192.168.1.5:8081'
        const ip = hostUri.split(':')[0];
        return `http://${ip}:8000/remove-background`;
    }

    if (Platform.OS === 'android') {
        // Fallback for Android emulator
        return 'http://10.0.2.2:8000/remove-background';
    }
    // Fallback for iOS simulator
    return 'http://localhost:8000/remove-background';
};

export const API_URL = getApiUrl();

export interface BackgroundRemovalResult {
    success: boolean;
    uri?: string;
    error?: string;
}

/**
 * Uploads an image to the local FastAPI background removal service
 * and saves the resulting image to the local file system.
 */
export const removeBackground = async (imageUri: string): Promise<BackgroundRemovalResult> => {
    try {
        
        // 1. Get file name and type
        const filename = imageUri.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        // 2. Prepare FormData
        const formData = new FormData();
        formData.append('file', {
            uri: imageUri,
            name: filename,
            type,
        } as any);

        // 3. Send to API (FastAPI)
        
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API returned ${response.status}: ${errorText}`);
        }

        // 4. Download and save the response blob
        // We can't directly use response.blob() with Expo easily, so we'll use FileSystem.downloadAsync
        const blob = await response.blob();
        
        // Generate a new unique filename
        const newFilename = `processed_${Date.now()}_${filename}`;
        const finalUri = `${FileSystem.documentDirectory}${newFilename}`;

        // React Native fetch implementation can be tricky with blobs. 
        // We'll read the blob as base64 and save it.
        const reader = new FileReader();
        
        return new Promise((resolve, reject) => {
            reader.onload = async () => {
                try {
                    const base64data = reader.result as string;
                    // base64data is like: data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...
                    const base64Str = base64data.split(',')[1];
                    
                    await FileSystem.writeAsStringAsync(finalUri, base64Str, {
                        encoding: FileSystem.EncodingType.Base64,
                    });
                    
                    resolve({ success: true, uri: finalUri });
                } catch (err: any) {
                    console.error('Error saving base64 data:', err);
                    resolve({ success: false, error: 'Failed to save processed image: ' + err.message });
                }
            };
            
            reader.onerror = () => {
                console.error('Error reading blob');
                resolve({ success: false, error: 'Failed to read response data from server' });
            };
            
            reader.readAsDataURL(blob);
        });

    } catch (error: any) {
        console.error('Background removal error:', error);
        return { 
            success: false, 
            error: error.message || 'An unexpected error occurred during background removal' 
        };
    }
};

export const bgRemovalService = {
    removeBackground,
};
