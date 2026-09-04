package com.flowprototype.backend.flow;

import com.flowprototype.backend.flow.model.ComponentDescriptor;

import java.util.List;

public interface ComponentDescriptorProvider {
    List<ComponentDescriptor> descriptors();
}
