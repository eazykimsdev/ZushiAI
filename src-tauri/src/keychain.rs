use keyring::Entry;

const SERVICE_NAME: &str = "com.lihforge.app";

pub fn save_api_key(provider: &str, api_key: &str) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, provider)
        .map_err(|e| format!("Failed to access OS keychain: {}", e))?;
    entry
        .set_password(api_key)
        .map_err(|e| format!("Failed to securely save API key in OS keychain: {}", e))?;
    Ok(())
}

pub fn get_api_key(provider: &str) -> Result<Option<String>, String> {
    let entry = match Entry::new(SERVICE_NAME, provider) {
        Ok(e) => e,
        Err(e) => return Err(format!("Failed to access OS keychain: {}", e)),
    };

    match entry.get_password() {
        Ok(pass) => Ok(Some(pass)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(format!("Failed to retrieve key from OS keychain: {}", e)),
    }
}

pub fn delete_api_key(provider: &str) -> Result<(), String> {
    let entry = match Entry::new(SERVICE_NAME, provider) {
        Ok(e) => e,
        Err(e) => return Err(format!("Failed to access OS keychain: {}", e)),
    };

    match entry.delete_credential() {
        Ok(_) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(format!("Failed to delete key from OS keychain: {}", e)),
    }
}

pub fn has_api_key(provider: &str) -> Result<bool, String> {
    match get_api_key(provider) {
        Ok(Some(k)) => Ok(!k.trim().is_empty()),
        Ok(None) => Ok(false),
        Err(e) => Err(e),
    }
}
