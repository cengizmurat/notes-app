export const validateNote = (title: string, content: string): string[] => {
    const errors: string[] = [];
    
    // Title validation
    if (!title.trim()) {
        errors.push('Title is required');
    } else if (title.length > 200) {
        errors.push('Title must be less than 200 characters');
    } else if (!/^[a-zA-Z0-9\s\-_.,!?()'"]+$/.test(title)) {
        errors.push('Title contains invalid characters');
    }

    // Content validation
    if (!content.trim()) {
        errors.push('Content is required');
    } else if (content.length > 10000) {
        errors.push('Content must be less than 10000 characters');
    }

    return errors;
}; 